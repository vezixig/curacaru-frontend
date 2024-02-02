import { Component, OnDestroy, OnInit } from '@angular/core';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDateParserFormatter, NgbDatepickerModule, NgbTimepickerModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { Subscription, forkJoin, map } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UUID } from 'angular2-uuid';

import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GermanDateParserFormatter } from '@curacaru/i18n/date-formatter';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { RideCostsType } from '@curacaru/enums/ride-cost-type.enum';
import { Appointment, CustomerListEntry, EmployeeBasic, UserEmployee } from '@curacaru/models';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';

@Component({
  imports: [CommonModule, FontAwesomeModule, FormsModule, NgbDatepickerModule, NgbTimepickerModule, NgxSkeletonLoaderModule, RouterModule, ReactiveFormsModule, NgbTypeaheadModule],
  selector: 'cura-appointments-editor',
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }, ApiService],
  standalone: true,
  templateUrl: './appointments-editor.component.html',
})
export class AppointmentsEditorComponent implements OnInit, OnDestroy {
  faCalendar = faCalendar;
  RideCostType = RideCostsType;

  appointmentForm: FormGroup;
  canFinish: boolean = false;
  customers: CustomerListEntry[] = [];
  employees: EmployeeBasic[] = [];
  isDone: boolean = false;
  isFinishing: boolean = false;
  isLoading: boolean = false;
  isNew: boolean = true;
  isSaving: boolean = false;
  user?: UserEmployee;

  private appointmentId?: UUID;
  private getAppointmentSubscription?: Subscription;
  private getCustomerListSubscription?: Subscription;
  private getEmployeeListSubscription?: Subscription;
  private postAppointmentSubscription?: Subscription;
  private postFinishSubscription?: Subscription;
  private updateAppointmentSubscription?: Subscription;

  constructor(private apiService: ApiService, private formBuilder: FormBuilder, private router: Router, private toastr: ToastrService, private userService: UserService) {
    this.user = this.userService.user;
    this.appointmentForm = this.formBuilder.group({
      customerId: ['', [Validators.required]],
      date: ['', [Validators.required]],
      distanceToCustomer: [0],
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
  }

  ngOnDestroy() {
    this.getAppointmentSubscription?.unsubscribe();
    this.getEmployeeListSubscription?.unsubscribe();
    this.getCustomerListSubscription?.unsubscribe();
    this.postAppointmentSubscription?.unsubscribe();
    this.postFinishSubscription?.unsubscribe();
    this.updateAppointmentSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.isNew = this.router.url.endsWith('new');
    this.isLoading = true;

    forkJoin({ customers: this.apiService.getCustomerList(), employees: this.apiService.getEmployeeBaseList() }).subscribe({
      next: (result) => {
        this.employees = result.employees;
        this.customers = result.customers;
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

    this.getAppointmentSubscription = this.apiService
      .getAppointment(this.appointmentId)
      .pipe(map((result) => this.deserializeDates(result)))
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

  private deserializeDates(obj: any): any {
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
    const employeeId = this.customers.find((e) => e.id === customerId)?.associatedEmployeeId ?? null;
    this.appointmentForm.get('employeeId')?.setValue(employeeId);
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
