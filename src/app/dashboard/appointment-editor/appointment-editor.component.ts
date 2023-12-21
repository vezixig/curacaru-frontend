import { Component, OnDestroy, OnInit } from '@angular/core';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgbDateParserFormatter, NgbDatepickerModule, NgbTimepickerModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { Subscription, first } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UUID } from 'angular2-uuid';

import { Appointment } from '../../models/appointment.model';
import { CommonModule } from '@angular/common';
import { CustomerListEntry } from '../../models/customer-list-entry.model';
import { DateTimeService } from '../../services/date-time.service';
import { EmployeeBasic as EmployeeBase } from '../../models/employee-basic.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GermanDateParserFormatter } from '../../i18n/date-formatter';

@Component({
  imports: [CommonModule, FontAwesomeModule, FormsModule, NgbDatepickerModule, NgbTimepickerModule, RouterModule, ReactiveFormsModule, NgbTypeaheadModule],
  selector: 'cura-appointment-editor',
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }],
  standalone: true,
  templateUrl: './appointment-editor.component.html',
})
export class AppointmentEditorComponent implements OnInit, OnDestroy {
  faCalendar = faCalendar;

  appointmentForm: FormGroup;
  employees: EmployeeBase[] = [];
  customers: CustomerListEntry[] = [];

  isNew: boolean = true;

  private _getEmployeeListSubscription?: Subscription;
  private _getCustomerListSubscription?: Subscription;
  private _postAppointmentSubscription?: Subscription;
  private _updateAppointmentSubscription?: Subscription;
  private _appointmentId?: UUID;

  constructor(private formBuilder: FormBuilder, private httpClient: HttpClient, private router: Router, private toastr: ToastrService) {
    this.appointmentForm = this.formBuilder.group({
      isSignedByEmployee: [false],
      isSignedByCustomer: [false],
      notes: [''],
      date: ['', [Validators.required]],
      timeStart: ['', [Validators.required]],
      timeEnd: ['', [Validators.required]],
      customerId: ['', [Validators.required]],
      employeeId: ['', [Validators.required]],
      employeeReplacementId: [''],
    });

    this.appointmentForm.get('customerId')?.valueChanges.subscribe((value) => this.onCustomerChanged(value));

    this.loadEmployeeList();
    this.loadCustomerList();
  }

  ngOnDestroy() {
    this._getEmployeeListSubscription?.unsubscribe();
    this._getCustomerListSubscription?.unsubscribe();
    this._postAppointmentSubscription?.unsubscribe();
    this._updateAppointmentSubscription?.unsubscribe();
  }

  ngOnInit() {
    if (this.router.url.endsWith('new')) {
      this.isNew = true;
    } else {
      this.loadAppointment();
    }
  }

  loadAppointment() {
    this.isNew = false;
    this._appointmentId = this.router.url.split('/').pop() ?? '';
    this.httpClient
      .get<Appointment>(`https://localhost:7077/appointment/${this._appointmentId}`)
      .pipe(first())
      .subscribe({
        next: (result) => {
          console.log(result);

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

          console.log(this.appointmentForm.value);
        },
        error: (error) => {
          this.toastr.error('Termin konnte nicht geladen werden: ' + error.message);
        },
      });
  }

  onSave() {
    const appointment: Appointment = {
      id: this._appointmentId,
      employeeId: this.appointmentForm.get('employeeId')?.value,
      employeeReplacementId: this.appointmentForm.get('employeeReplacementId')?.value,
      customerId: this.appointmentForm.get('customerId')?.value,
      date: this.appointmentForm.get('date')?.value,
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
    const customSerializer = (key: string, value: any) => {
      if (typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
        return DateTimeService.toDateString(value);
      }
      if (typeof value === 'object' && 'hours' in value && 'minutes' in value) {
        return DateTimeService.toTimeString(value);
      }
      return value;
    };

    const serializedData = JSON.stringify(appointment, customSerializer);
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this._postAppointmentSubscription?.unsubscribe();
    this._postAppointmentSubscription = this.httpClient
      .post('https://localhost:7077/appointment/new', serializedData, { headers: headers })
      .pipe(first())
      .subscribe({
        complete: () => {
          this.toastr.success('Ein neuer Termin wurde angelegt');
          this.router.navigate(['/dashboard/appointment']);
        },
        error: (error) => {
          this.toastr.error('Termin konnte nicht angelegt werden: ' + error.message);
        },
      });
  }

  private loadCustomerList() {
    this._getCustomerListSubscription = this.httpClient
      .get<CustomerListEntry[]>('https://localhost:7077/customer/list')
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.customers = result;
        },
        error: (error) => {
          this.toastr.error('Kundenliste konnte nicht abgerufen werden: ' + error.message);
        },
      });
  }

  private loadEmployeeList() {
    this._getEmployeeListSubscription = this.httpClient
      .get<EmployeeBase[]>('https://localhost:7077/employee/baselist')
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.employees = result;
        },
        error: (error) => {
          this.toastr.error('Mitarbeiterliste konnte nicht abgerufen werden: ' + error.message);
        },
      });
  }

  private onCustomerChanged(customerId: number): void {
    const employeeId = this.customers.find((e) => e.id === customerId)?.associatedEmployeeId ?? null;
    this.appointmentForm.get('employeeId')?.setValue(employeeId);
  }

  private UpdateAppointment(appointment: Appointment) {
    console.log(appointment);

    const customSerializer = (key: string, value: any) => {
      if (typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
        return DateTimeService.toDateString(value);
      }
      if (typeof value === 'object' && 'hours' in value && 'minutes' in value) {
        return DateTimeService.toTimeString(value);
      }
      return value;
    };

    const serializedData = JSON.stringify(appointment, customSerializer);
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this._updateAppointmentSubscription?.unsubscribe();

    this._updateAppointmentSubscription = this.httpClient.put<Appointment>('https://localhost:7077/appointment', serializedData, { headers: headers }).subscribe({
      complete: () => {
        this.toastr.success('Änderungen am Termin wurden gespeichert');
        this.router.navigate(['/dashboard/appointment']);
      },
      error: (error) => {
        this.toastr.error('Fehler beim Speichern der Änderungen: ' + error.message);
      },
    });
  }
}
