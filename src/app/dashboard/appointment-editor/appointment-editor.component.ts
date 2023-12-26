import { Component, OnDestroy, OnInit } from '@angular/core';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDateParserFormatter, NgbDatepickerModule, NgbTimepickerModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { Subscription, map } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UUID } from 'angular2-uuid';

import { Appointment } from '../../models/appointment.model';
import { CommonModule } from '@angular/common';
import { CustomerListEntry } from '../../models/customer-list-entry.model';
import { DateTimeService } from '../../services/date-time.service';
import { EmployeeBasic as EmployeeBase } from '../../models/employee-basic.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GermanDateParserFormatter } from '../../i18n/date-formatter';
import { UserService } from '../../services/user.service';
import { UserEmployee } from '../../models/user-employee.model';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ApiService } from '../../services/api.service';

@Component({
  imports: [CommonModule, FontAwesomeModule, FormsModule, NgbDatepickerModule, NgbTimepickerModule, NgxSkeletonLoaderModule, RouterModule, ReactiveFormsModule, NgbTypeaheadModule],
  selector: 'cura-appointment-editor',
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }, ApiService],
  standalone: true,
  templateUrl: './appointment-editor.component.html',
})
export class AppointmentEditorComponent implements OnInit, OnDestroy {
  faCalendar = faCalendar;

  appointmentForm: FormGroup;
  canFinish: boolean = false;
  customers: CustomerListEntry[] = [];
  employees: EmployeeBase[] = [];
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
      isSignedByEmployee: [false],
      isSignedByCustomer: [false],
      notes: [''],
      date: ['', [Validators.required]],
      timeStart: ['', [Validators.required]],
      timeEnd: ['', [Validators.required]],
      customerId: ['', [Validators.required]],
      employeeId: [this.user?.isManager ? '' : this.user?.id, [Validators.required]],
      employeeReplacementId: [''],
    });

    // only managers can change the employee
    if (!this.user?.isManager) {
      this.appointmentForm.get('employeeId')?.disable();
      this.appointmentForm.get('employeeReplacementId')?.disable();
    }
    this.appointmentForm.get('customerId')?.valueChanges.subscribe((value) => this.onCustomerChanged(value));

    this.loadEmployeeList();
    this.loadCustomerList();
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
    if (this.router.url.endsWith('new')) {
      this.isNew = true;
    } else {
      this.loadAppointment();
    }
  }

  loadAppointment() {
    this.isLoading = true;
    this.isNew = false;
    this.appointmentId = this.router.url.split('/').pop() ?? '';
    this.getAppointmentSubscription = this.apiService
      .getAppointment(this.appointmentId)
      .pipe(map((result) => this.deserializeDates(result)))
      .subscribe({
        next: (result) => {
          this.appointmentForm.patchValue({
            customerId: result.customerId,
            employeeId: result.employeeId,
            employeeReplacementId: result.employeeReplacementId,
            date: DateTimeService.toNgbDate(result.date),
            timeStart: DateTimeService.toNgbTime(result.timeStart),
            timeEnd: DateTimeService.toNgbTime(result.timeEnd),
            isSignedByEmployee: result.isSignedByEmployee,
            isSignedByCustomer: result.isSignedByCustomer,
            notes: result.notes,
          });

          if (result.isDone) {
            this.appointmentForm.disable();
          }
          this.isDone = result.isDone;
          this.canFinish = !result.isDone && result.isSignedByCustomer && result.isSignedByEmployee;
          this.isLoading = false;
        },
        error: (error) => {
          if (error.status === 404) {
            this.toastr.error('Termin wurde nicht gefunden');
            this.router.navigate(['/dashboard/appointment']);
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
        this.router.navigate(['/dashboard/appointment']);
      },
      error: (error) => {
        this.toastr.error(`Termin konnte nicht abgeschlossen werden: [${error.status}] ${error.error}`);
        this.isFinishing = false;
      },
    });
  }

  onSave() {
    const appointment: Appointment = {
      id: this.appointmentId,
      employeeId: this.appointmentForm.get('employeeId')?.value,
      employeeReplacementId: this.appointmentForm.get('employeeReplacementId')?.value,
      customerId: this.appointmentForm.get('customerId')?.value,
      date: DateTimeService.toDate(this.appointmentForm.get('date')?.value),
      timeStart: DateTimeService.toTime(this.appointmentForm.get('timeStart')?.value),
      timeEnd: DateTimeService.toTime(this.appointmentForm.get('timeEnd')?.value),
      isSignedByEmployee: this.appointmentForm.get('isSignedByEmployee')?.value,
      isSignedByCustomer: this.appointmentForm.get('isSignedByCustomer')?.value,
      notes: this.appointmentForm.get('notes')?.value,
      isDone: false,
    };
    appointment.employeeReplacementId = appointment.employeeReplacementId == '' ? undefined : appointment.employeeReplacementId;

    if (appointment.timeStart.hours * 60 + appointment.timeStart.minutes > appointment.timeEnd.hours * 60 + appointment.timeEnd.minutes) {
      this.toastr.warning('Startzeit muss vor Endzeit liegen');
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
        this.router.navigate(['/dashboard/appointment']);
      },
      error: (error) => {
        this.toastr.error(`Termin konnte nicht angelegt werden: [${error.status}] ${error.error}`);
        this.isSaving = false;
      },
    });
  }

  private loadCustomerList() {
    this.getCustomerListSubscription = this.apiService.getCustomerList().subscribe({
      next: (result) => (this.customers = result),
      error: (error) => this.toastr.error(`Kundenliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`),
    });
  }

  private loadEmployeeList() {
    this.getEmployeeListSubscription = this.apiService.getEmployeeBaseList().subscribe({
      next: (result) => (this.employees = result),
      error: (error) => this.toastr.error(`Mitarbeiterliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`),
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
        this.router.navigate(['/dashboard/appointment']);
      },
      error: (error) => {
        this.toastr.error(`Fehler beim Speichern der Änderungen: [${error.status}] ${error.error}`);
        this.isSaving = false;
      },
    });
  }
}
