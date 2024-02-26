import { Component, OnDestroy, OnInit } from '@angular/core';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDateParserFormatter, NgbDatepickerModule, NgbTimepickerModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, forkJoin, map, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UUID } from 'angular2-uuid';

import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GermanDateParserFormatter } from '@curacaru/i18n/date-formatter';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { RideCostsType } from '@curacaru/enums/ride-cost-type.enum';
import { Appointment, Customer, EmployeeBasic, MinimalCustomerListEntry, UserEmployee } from '@curacaru/models';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { CustomerBudget } from '@curacaru/models/customer-budget.model';
import { CompanyPrices } from '@curacaru/models/company-prices.model';
import { ClearanceType } from '@curacaru/enums/clearance-type';

@Component({
  imports: [
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    NgbDatepickerModule,
    NgbTimepickerModule,
    NgxSkeletonLoaderModule,
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
  RideCostType = RideCostsType;
  clearanceType = ClearanceType;

  appointmentForm: FormGroup;
  canFinish: boolean = false;
  customers: MinimalCustomerListEntry[] = [];
  employees: EmployeeBasic[] = [];
  isDone: boolean = false;
  isFinishing: boolean = false;
  isLoading: boolean = false;
  isNew: boolean = true;
  isSaving: boolean = false;
  selectedCustomer?: CustomerBudget;
  user?: UserEmployee;

  private $onDestroy = new Subject();

  private appointmentId?: UUID;
  private postAppointmentSubscription?: Subscription;
  private postFinishSubscription?: Subscription;
  private updateAppointmentSubscription?: Subscription;
  private companyPrices?: CompanyPrices;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private userService: UserService
  ) {
    this.user = this.userService.user;
    this.appointmentForm = this.formBuilder.group({
      customerId: ['', [Validators.required]],
      date: ['', [Validators.required]],
      distanceToCustomer: [0],
      clearanceType: [null, [Validators.required]],
      employeeId: [this.user?.isManager ? '' : this.user?.id, [Validators.required]],
      employeeReplacementId: [''],
      isSignedByCustomer: [false],
      isSignedByEmployee: [false],
      notes: [''],
      timeEnd: ['', [Validators.required]],
      timeStart: ['', [Validators.required]],
    });

    // only managers can change the employee
    if (!this.user?.isManager) {
      this.appointmentForm.get('employeeId')?.disable();
      this.appointmentForm.get('employeeReplacementId')?.disable();
    }
    this.appointmentForm.get('customerId')?.valueChanges.subscribe((value) => this.onCustomerChanged(value));
    this.appointmentForm.get('distanceToCustomer')?.valueChanges.subscribe(() => this.calculatePrice());
    this.appointmentForm.get('timeEnd')?.valueChanges.subscribe(() => this.calculatePrice());
    this.appointmentForm.get('timeStart')?.valueChanges.subscribe(() => this.calculatePrice());
    this.appointmentForm.get('customerId')?.valueChanges.subscribe(() => this.calculatePrice());
  }

  selectedClearanceType?: ClearanceType;
  canClearPreventiveCare = true;
  canClearCareBenefit = true;
  canClearReliefAmount = true;
  canClearSelfPayment = true;

  onClearanceTypeChanged() {
    this.calculatePrice();
  }

  private calculatePrice() {
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
      clearanceType = clearanceType == ClearanceType.careBenefit && !this.canClearCareBenefit ? undefined : clearanceType;

      this.canClearPreventiveCare = this.selectedCustomer.preventiveCareAmount >= price;
      clearanceType = clearanceType == ClearanceType.preventiveCare && !this.canClearPreventiveCare ? undefined : clearanceType;

      this.canClearReliefAmount = this.selectedCustomer.reliefAmount >= price;
      clearanceType = clearanceType == ClearanceType.reliefAmount && !this.canClearReliefAmount ? undefined : clearanceType;

      this.canClearSelfPayment = this.selectedCustomer.selfPayAmount >= price;
      clearanceType = clearanceType == ClearanceType.selfPayment && !this.canClearSelfPayment ? undefined : clearanceType;

      this.selectedClearanceType = clearanceType;
      this.appointmentForm.get('clearanceType')?.setValue(clearanceType);
    }
  }

  ngOnDestroy() {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }

  ngOnInit() {
    this.isNew = this.router.url.endsWith('new');
    this.isLoading = true;

    forkJoin({
      customers: this.apiService.getMinimalCustomerList(),
      employees: this.apiService.getEmployeeBaseList(),
      companyPrices: this.apiService.getCompanyPrices(),
    })
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        next: (result) => {
          this.employees = result.employees;
          this.customers = result.customers;
          this.companyPrices = result.companyPrices;
        },
        complete: () => {
          if (!this.isNew) {
            this.loadAppointment();
          } else {
            this.isLoading = false;
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
          this.appointmentForm.patchValue({
            customerId: result.customerId,
            date: DateTimeService.toNgbDate(result.date),
            distanceToCustomer: result.distanceToCustomer,
            employeeId: result.employeeId,
            employeeReplacementId: result.employeeReplacementId,
            isSignedByCustomer: result.isSignedByCustomer,
            isSignedByEmployee: result.isSignedByEmployee,
            notes: result.notes,
            timeEnd: DateTimeService.toNgbTime(result.timeEnd),
            timeStart: DateTimeService.toNgbTime(result.timeStart),
          });

          if (result.isDone) {
            this.appointmentForm.disable();
          }
          this.isDone = result.isDone;
          this.canFinish = !result.isDone; // && result.isSignedByCustomer && result.isSignedByEmployee;
          this.isLoading = false;
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
    this.isFinishing = true;
    this.postFinishSubscription?.unsubscribe();
    this.postFinishSubscription = this.apiService.finishAppointment(this.appointmentId!).subscribe({
      complete: () => {
        this.toastr.success('Termin wurde abgeschlossen');
        this.router.navigate(['/dashboard/appointments']);
      },
      error: (error) => {
        this.toastr.error(`Termin konnte nicht abgeschlossen werden: [${error.status}] ${error.error}`);
        this.isFinishing = false;
      },
    });
  }

  onSave() {
    const appointment: Appointment = {
      customerId: this.appointmentForm.get('customerId')?.value,
      date: DateTimeService.toDate(this.appointmentForm.get('date')?.value),
      distanceToCustomer: +this.appointmentForm.get('distanceToCustomer')?.value,
      employeeId: this.appointmentForm.get('employeeId')?.value,
      employeeReplacementId: this.appointmentForm.get('employeeReplacementId')?.value,
      id: this.appointmentId,
      isDone: false,
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

  private onCustomerChanged(customerId: number): void {
    if (this.isLoading) return;

    this.apiService
      .getCustomerWithBudget(customerId)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe((customer) => {
        this.selectedCustomer = customer;
        this.appointmentForm.get('employeeId')?.setValue(customer.associatedEmployeeId);
      });
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
