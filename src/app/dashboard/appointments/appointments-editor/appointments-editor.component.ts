import { Component, OnDestroy, OnInit, TemplateRef, inject, signal } from '@angular/core';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NgbDate,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbOffcanvas,
  NgbTimepickerModule,
  NgbTypeaheadModule,
} from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, Subject, Subscription, debounceTime, filter, forkJoin, map, switchMap, takeUntil, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UUID } from 'angular2-uuid';

import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GermanDateParserFormatter } from '@curacaru/i18n/date-formatter';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { RideCostsType } from '@curacaru/enums/ride-cost-type.enum';
import { Appointment, EmployeeBasic, MinimalCustomerListEntry, UserEmployee } from '@curacaru/models';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { CustomerBudget } from '@curacaru/models/customer-budget.model';
import { CompanyPrices } from '@curacaru/models/company-prices.model';
import { ClearanceType } from '@curacaru/enums/clearance-type';
import { faCheck, faCircleExclamation, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { AppointmentRepository } from '@curacaru/services/repositories/appointment.repository';
import { SignatureComponent } from '@curacaru/shared/signature/signature.component';

@Component({
  imports: [
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    NgbDatepickerModule,
    NgbTimepickerModule,
    NgxSkeletonLoaderModule,
    SignatureComponent,
    RouterModule,
    ReactiveFormsModule,
    NgbTypeaheadModule,
  ],
  selector: 'cura-appointments-editor',
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }, ApiService],
  standalone: true,
  templateUrl: './appointments-editor.component.html',
})
export class AppointmentsEditorComponent implements OnInit, OnDestroy {
  faCalendar = faCalendar;
  faCheck = faCheck;
  faCircleInfo = faCircleInfo;
  faCircleExclamation = faCircleExclamation;
  RideCostType = RideCostsType;

  clearanceType = ClearanceType;

  blockingAppointment$: Observable<boolean>;
  appointmentForm: FormGroup;
  canFinish = false;
  canOpen = false;
  canSign = signal(false);
  customers: MinimalCustomerListEntry[] = [];
  employees: EmployeeBasic[] = [];
  hasBudgetError = false;
  isDone = false;
  isExpired = false;
  isChangingStatus = false;
  isLoading = false;
  isNew = true;
  isPlanning = false;
  isSaving = false;
  minDate = new NgbDate(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  selectedCustomer?: CustomerBudget;
  today = new Date();
  user?: UserEmployee;

  initialBudget = signal({
    careBenefit: 0,
    preventiveCare: 0,
    reliefAmount: 0,
    selfPayment: 0,
  });

  private readonly offcanvasService = inject(NgbOffcanvas);
  private readonly appointmentRepository = inject(AppointmentRepository);
  private readonly activeRoute = inject(ActivatedRoute);

  private $onDestroy = new Subject();
  private $onTimeChanged = new Subject();

  private appointmentId?: UUID;

  private companyPrices?: CompanyPrices;
  existingAppointment?: Appointment;
  private nextMonth = new NgbDate(new Date().getFullYear(), new Date().getMonth() + 2, 1);
  private postAppointmentSubscription?: Subscription;
  private updateAppointmentSubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private userService: UserService
  ) {
    this.blockingAppointment$ = this.$onTimeChanged.pipe(
      debounceTime(300),
      filter(() => {
        const employeeId = this.appointmentForm.get('employeeId')?.value;
        const timeStartValue = this.appointmentForm.get('timeStart')?.value;
        const timeEndValue = this.appointmentForm.get('timeEnd')?.value;
        return employeeId != null && employeeId != '' && timeStartValue != null && timeStartValue != '' && timeEndValue != null && timeEndValue != '';
      }),
      switchMap(() => {
        const employeeId =
          this.appointmentForm.get('employeeReplacementId')?.value != '' && this.appointmentForm.get('employeeReplacementId')?.value != null
            ? this.appointmentForm.get('employeeReplacementId')?.value
            : this.appointmentForm.get('employeeId')?.value;
        return this.appointmentRepository.getIsBlockingAppointment(
          employeeId,
          DateTimeService.toDate(this.appointmentForm.get('date')?.value),
          DateTimeService.toTime(this.appointmentForm.get('timeStart')?.value),
          DateTimeService.toTime(this.appointmentForm.get('timeEnd')?.value),
          this.appointmentId
        );
      }),
      tap((isBlocking) => {
        this.appointmentForm.get('isNotBlockingAppointment')?.setValue(!isBlocking);
      })
    );

    this.appointmentForm = this.formBuilder.group({
      customerId: ['', [Validators.required]],
      date: ['', { Validators: Validators.required, updateOn: 'blur' }],
      distanceToCustomer: [0],
      clearanceType: [null, [Validators.required]],
      employeeId: ['', [Validators.required]],
      employeeReplacementId: [''],
      isSignedByCustomer: [false],
      isSignedByEmployee: [false],
      isDone: [false],
      isNotBlockingAppointment: [false, [Validators.requiredTrue]],
      notes: [''],
      timeEnd: ['', [Validators.required]],
      timeStart: ['', [Validators.required]],
    });

    this.appointmentForm.get('customerId')?.valueChanges.subscribe((value) => this.onCustomerChanged(value));
    this.appointmentForm.get('employeeId')?.valueChanges.subscribe(() => this.$onTimeChanged.next(true));
    this.appointmentForm.get('employeeReplacementId')?.valueChanges.subscribe(() => this.$onTimeChanged.next(true));
    this.appointmentForm.get('distanceToCustomer')?.valueChanges.subscribe(() => this.calculatePrice());
    this.appointmentForm.get('date')?.valueChanges.subscribe((value) => this.onDateChanged(value));
    this.appointmentForm.get('timeEnd')?.valueChanges.subscribe(() => this.onTimeChanged());
    this.appointmentForm.get('timeStart')?.valueChanges.subscribe(() => this.onTimeChanged());
  }

  onTimeChanged() {
    this.calculatePrice();
    this.$onTimeChanged.next(true);
  }

  selectedClearanceType?: ClearanceType;
  canClearPreventiveCare = true;
  canClearCareBenefit = true;
  canClearReliefAmount = true;
  canClearSelfPayment = true;

  onClearanceTypeChanged() {
    this.calculatePrice();
  }

  ngOnDestroy() {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }

  openOffCanvas(template: TemplateRef<any>) {
    this.offcanvasService.open(template, { position: 'bottom', panelClass: 'signature-panel', backdrop: 'static' });
  }

  ngOnInit() {
    this.isNew = !this.activeRoute.snapshot.params['id'];
    this.isLoading = true;

    forkJoin({
      customers: this.apiService.getMinimalCustomerList(),
      employees: this.apiService.getEmployeeBaseList(),
      companyPrices: this.apiService.getCompanyPrices(),
      user: this.userService.user$,
    })
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        next: (result) => {
          // only managers can change the employee
          if (!result.user.isManager) {
            this.appointmentForm.get('employeeId')?.disable();
            this.appointmentForm.get('employeeReplacementId')?.disable();
            this.appointmentForm.get('employeeId')?.setValue(result.user.id);
          } else if (this.activeRoute.snapshot.queryParams['employeeId']) {
            this.appointmentForm.get('employeeId')?.setValue(this.activeRoute.snapshot.queryParams['employeeId']);
          }

          this.user = result.user;
          this.employees = result.employees;
          this.customers = result.customers;
          if (this.activeRoute.snapshot.queryParams['customerId']) {
            this.appointmentForm.get('customerId')?.setValue(this.activeRoute.snapshot.queryParams['customerId']);
          }
          if (this.activeRoute.snapshot.queryParams['date']) {
            this.appointmentForm.get('date')?.setValue(DateTimeService.toNgbDate(this.activeRoute.snapshot.queryParams['date']));
          }

          this.companyPrices = result.companyPrices;
        },
        complete: () => {
          if (this.isNew) {
            this.isLoading = false;
            if (this.appointmentForm.get('customerId')?.value) {
              this.onCustomerChanged(this.appointmentForm.get('customerId')?.value, true);
            }
            this.onDateChanged(this.appointmentForm.get('date')?.value);
          } else {
            this.loadAppointment();
          }
        },
        error: (error) => this.toastr.error(`Daten konnten nicht abgerufen werden: [${error.status}] ${error.error}`),
      });
  }

  loadAppointment() {
    this.isNew = false;
    this.appointmentId = this.router.url.split('/').pop() ?? '';

    this.apiService
      .getAppointment(this.appointmentId)
      .pipe(
        takeUntil(this.$onDestroy),
        map((result) => this.deserializeDates(result))
      )
      .subscribe({
        next: (result) => {
          if (!this.customers.find((x) => x.customerId === result.customerId)) {
            this.customers.push(result.customer!);
          }

          this.appointmentForm.patchValue({
            customerId: result.customerId,
            clearanceType: result.clearanceType,
            date: DateTimeService.toNgbDate(result.date),
            distanceToCustomer: result.distanceToCustomer,
            employeeId: result.employeeId,
            employeeReplacementId: result.employeeReplacementId,
            isSignedByCustomer: result.isSignedByCustomer,
            isSignedByEmployee: result.isSignedByEmployee,
            isDone: result.isDone,
            notes: result.notes,
            timeEnd: DateTimeService.toNgbTime(result.timeEnd),
            timeStart: DateTimeService.toNgbTime(result.timeStart),
          });

          this.isExpired = this.minDate.after(DateTimeService.toNgbDate(result.date));
          if (result.isDone || this.isExpired) {
            this.appointmentForm.disable();
          }

          this.hasBudgetError = result.hasBudgetError;
          this.isPlanning = result.isPlanned;
          this.existingAppointment = result;
          this.selectedClearanceType = result.clearanceType;
          this.isDone = result.isDone;
          this.canFinish = !this.isNew && !result.isDone && result.isSignedByCustomer && result.isSignedByEmployee && result.date <= this.today;
          this.canSign.set(!this.isNew && result.date <= this.today && this.user?.id === result.employeeId);
          this.canOpen = (this.user?.isManager ?? false) && !this.isNew && result.isDone && result.date >= DateTimeService.beginOfCurrentMonth;
          this.isLoading = false;
          this.onCustomerChanged(result.customerId, true);
          this.calculatePrice();
        },
        error: (error) => {
          if (error.status === 404) {
            this.toastr.error('Termin wurde nicht gefunden');
            this.router.navigate(['/dashboard/appointments']);
          } else {
            this.toastr.error(`Termin konnte nicht geladen werden: [${error.status}] ${error.error}`);
            this.isLoading = false;
          }
        },
      });
  }

  onEmployeeSigned($event: string) {
    this.appointmentRepository
      .addEmployeeSignature(this.appointmentId!, $event)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        next: () => {
          this.loadAppointment();
          this.offcanvasService.dismiss();
        },
        error: (error) => {
          this.toastr.error(`Unterschrift konnte nicht gespeichert werden: [${error.status}] ${error.error}`);
        },
      });
  }

  onCustomerSigned($event: string) {
    this.appointmentRepository
      .addCustomerSignature(this.appointmentId!, $event)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        next: () => {
          this.loadAppointment();
          this.offcanvasService.dismiss();
        },
        error: (error) => {
          this.toastr.error(`Unterschrift konnte nicht gespeichert werden: [${error.status}] ${error.error}`);
        },
      });
  }

  private calculatePrice() {
    if (this.isPlanning) {
      this.appointmentForm.get('clearanceType')?.setValue(this.selectedClearanceType);
      return;
    }

    const timeStartValue = this.appointmentForm.get('timeStart')?.value;
    const timeEndValue = this.appointmentForm.get('timeEnd')?.value;

    if (this.selectedCustomer != null && timeStartValue != null && timeStartValue != '' && timeEndValue != null && timeEndValue != '') {
      // calculate appointment price
      const timeEnd = DateTimeService.toTime(timeEndValue);
      const timeStart = DateTimeService.toTime(timeStartValue);

      const hours = (timeEnd.hours * 60 + timeEnd.minutes - timeStart.hours * 60 + timeStart.minutes) / 60;

      let rideCosts = 0;
      if (this.companyPrices?.rideCostsType === RideCostsType.FlatRate) {
        rideCosts = this.companyPrices?.rideCosts;
      } else if (this.companyPrices?.rideCostsType === RideCostsType.Kilometer) {
        rideCosts = this.companyPrices?.rideCosts * this.appointmentForm.get('distanceToCustomer')?.value;
      }

      const price = (this.companyPrices?.pricePerHour ?? 0) * hours + rideCosts;

      // check budgets
      let clearanceType = this.selectedClearanceType;
      this.canClearCareBenefit = this.selectedCustomer.careBenefitAmount >= price;
      this.canClearPreventiveCare = this.selectedCustomer.preventiveCareAmount >= price;
      this.canClearReliefAmount = this.selectedCustomer.reliefAmount >= price;
      this.canClearSelfPayment = this.selectedCustomer.selfPayAmount >= price;

      switch (clearanceType) {
        case ClearanceType.careBenefit:
          clearanceType = this.canClearCareBenefit ? clearanceType : undefined;
          break;
        case ClearanceType.preventiveCare:
          clearanceType = this.canClearPreventiveCare ? clearanceType : undefined;
          break;
        case ClearanceType.reliefAmount:
          clearanceType = this.canClearReliefAmount ? clearanceType : undefined;
          break;
        case ClearanceType.selfPayment:
          clearanceType = this.canClearSelfPayment ? clearanceType : undefined;
          break;
      }

      this.selectedClearanceType = clearanceType;
      this.appointmentForm.get('clearanceType')?.setValue(clearanceType);
    }
  }

  private deserializeDates(obj: any): Appointment {
    //Check if the property is a Date type
    if (obj instanceof Object && obj.hasOwnProperty('date') && typeof obj.date === 'string') {
      obj.date = new Date(obj.date);
    }
    if (obj instanceof Object && obj.hasOwnProperty('timeStart') && typeof obj.timeStart === 'string') {
      obj.timeStart = DateTimeService.toTime(obj.timeStart);
    }
    if (obj instanceof Object && obj.hasOwnProperty('timeEnd') && typeof obj.timeEnd === 'string') {
      obj.timeEnd = DateTimeService.toTime(obj.timeEnd);
    }
    return obj;
  }

  onFinish() {
    this.isChangingStatus = true;
    this.apiService
      .finishAppointment(this.appointmentId!)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        complete: () => {
          this.toastr.success('Termin wurde abgeschlossen');
          this.router.navigate(['/dashboard/appointments']);
        },
        error: (error) => {
          this.toastr.error(`Termin konnte nicht abgeschlossen werden: [${error.status}] ${error.error}`);
          this.isChangingStatus = false;
        },
      });
  }

  onReopen() {
    this.isChangingStatus = true;
    this.apiService
      .reopenAppointment(this.appointmentId!)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        complete: () => {
          this.toastr.success('Termin wurde wieder geöffnet');
          this.router.navigate(['/dashboard/appointments']);
        },
        error: (error) => {
          this.toastr.error(`Termin konnte nicht wieder geöffnet werden: [${error.status}] ${error.error}`);
          this.isChangingStatus = false;
        },
      });
  }

  onSave() {
    const appointment: Appointment = {
      clearanceType: this.appointmentForm.get('clearanceType')?.value,
      costs: 0,
      costsLastYearBudget: 0,
      customerId: this.appointmentForm.get('customerId')?.value,
      date: DateTimeService.toDate(this.appointmentForm.get('date')?.value),
      distanceToCustomer: +this.appointmentForm.get('distanceToCustomer')?.value,
      employeeId: this.appointmentForm.get('employeeId')?.value,
      employeeReplacementId: this.appointmentForm.get('employeeReplacementId')?.value,
      hasBudgetError: false,
      id: this.appointmentId,
      isDone: false,
      isPlanned: false,
      isSignedByCustomer: this.appointmentForm.get('isSignedByCustomer')?.value,
      isSignedByEmployee: this.appointmentForm.get('isSignedByEmployee')?.value,
      notes: this.appointmentForm.get('notes')?.value,
      timeEnd: DateTimeService.toTime(this.appointmentForm.get('timeEnd')?.value),
      timeStart: DateTimeService.toTime(this.appointmentForm.get('timeStart')?.value),
    };
    appointment.employeeReplacementId = appointment.employeeReplacementId == '' ? undefined : appointment.employeeReplacementId;

    if (appointment.timeStart.hours * 60 + appointment.timeStart.minutes > appointment.timeEnd.hours * 60 + appointment.timeEnd.minutes) {
      this.toastr.warning('Startzeit muss vor Endzeit liegen');
      return;
    }

    if (appointment.employeeId === appointment.employeeReplacementId) {
      this.toastr.warning('Mitarbeiter und Vertretung dürfen nicht identisch sein');
      return;
    }

    this.isNew ? this.CreateAppointment(appointment) : this.UpdateAppointment(appointment);
  }

  toggleIsSignedByCustomer() {
    this.appointmentForm.get('isSignedByCustomer')?.setValue(!this.appointmentForm.get('isSignedByCustomer')?.value);
  }

  toggleIsSignedByEmployee() {
    this.appointmentForm.get('isSignedByEmployee')?.setValue(!this.appointmentForm.get('isSignedByEmployee')?.value);
  }

  private CreateAppointment(appointment: Appointment) {
    this.isSaving = true;
    this.postAppointmentSubscription?.unsubscribe();
    this.postAppointmentSubscription = this.apiService.createAppointment(appointment).subscribe({
      complete: () => {
        this.toastr.success('Ein neuer Termin wurde angelegt');
        this.router.navigate(['/dashboard/appointments']);
      },
      error: (error) => {
        this.toastr.error(`Termin konnte nicht angelegt werden: [${error.status}] ${error.error}`);
        this.isSaving = false;
      },
    });
  }

  private onCustomerChanged(customerId: UUID, skipSetter = false): void {
    if (this.isLoading) return;

    this.apiService
      .getCustomerWithBudget(customerId)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe((customer) => {
        this.initialBudget.set({
          careBenefit: customer.careBenefitAmount,
          preventiveCare: customer.preventiveCareAmount,
          reliefAmount: customer.reliefAmount,
          selfPayment: customer.selfPayAmount,
        });

        if (!this.isNew) {
          switch (this.existingAppointment?.clearanceType) {
            case ClearanceType.careBenefit:
              customer.careBenefitAmount += this.existingAppointment?.costs ?? 0;
              break;
            case ClearanceType.preventiveCare:
              customer.preventiveCareAmount += this.existingAppointment?.costs ?? 0;
              break;
            case ClearanceType.selfPayment:
              customer.selfPayAmount += this.existingAppointment?.costs ?? 0;
              break;
            case ClearanceType.reliefAmount:
              customer.reliefAmount += (this.existingAppointment?.costs ?? 0) + (this.existingAppointment?.costsLastYearBudget ?? 0);
              break;
          }
        }
        this.selectedCustomer = customer;
        if (!skipSetter) {
          this.appointmentForm.get('employeeId')?.setValue(customer.associatedEmployeeId);
        }
        this.calculatePrice();
      });
  }

  private onDateChanged(date: NgbDate) {
    if (this.isLoading || this.isExpired) return;

    if (this.minDate.after(date)) {
      this.toastr.info('Termin kann nicht vor dem aktuellen Monat liegen');
      this.appointmentForm.get('date')?.setValue(this.minDate);
      date = this.minDate;
    }
    this.isPlanning = this.nextMonth.before(date) || this.nextMonth.equals(date);
    this.$onTimeChanged.next(true);
    this.calculatePrice();
  }

  private UpdateAppointment(appointment: Appointment) {
    this.isSaving = true;
    this.updateAppointmentSubscription?.unsubscribe();
    this.updateAppointmentSubscription = this.apiService.updateAppointment(appointment).subscribe({
      complete: () => {
        this.toastr.success('Änderungen am Termin wurden gespeichert');
        this.router.navigate(['/dashboard/appointments']);
      },
      error: (error) => {
        this.toastr.error(`Fehler beim Speichern der Änderungen: [${error.status}] ${error.error}`);
        this.isSaving = false;
      },
    });
  }
}
