import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
import { NgbCalendar, NgbDate, NgbDateParserFormatter, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { Subscription, first, map } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { faCalendar, faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { FormsModule } from '@angular/forms';
import { GermanDateParserFormatter } from '../../i18n/date-formatter';
import { AppointmentListEntry } from '../../models/appointment-list-entry.model';
import { TimeFormatPipe } from '../../pipes/time.pipe';
import { Customer } from '../../models/customer.model';
import { EmployeeBasic } from '../../models/employee-basic.model';
import { DateTimeService } from '../../services/date-time.service';
import { NgbdModalConfirm } from '../../modals/confirm-modal/confirm-modal.component';
import { UserService } from '../../services/user.service';

@Component({
  imports: [CommonModule, FontAwesomeModule, RouterModule, NgbDatepickerModule, FormsModule, TimeFormatPipe],
  selector: 'cura-appointment-list',
  standalone: true,
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }],
  styleUrls: ['./appointment-list.component.scss'],
  templateUrl: './appointment-list.component.html',
})
export class AppointmentListComponent implements OnDestroy, OnInit {
  faGear = faGear;
  faTrashCan = faTrashCan;
  faCalendar = faCalendar;

  appointments: AppointmentListEntry[] = [];
  employees: EmployeeBasic[] = [];
  selectedEmployee?: EmployeeBasic;
  customers: Customer[] = [];
  selectedCustomer?: Customer;

  private _deleteAppointmentSubscription?: Subscription;
  private _getAppointmentsSubscription?: Subscription;
  private _getEmployeeListSubscription?: Subscription;
  private _getCustomerListSubscription?: Subscription;

  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate | null = this.calendar.getToday();
  toDate: NgbDate | null = this.calendar.getToday();
  selectedEmployeeId?: number;
  selectedCustomerId?: number;
  isManager: boolean = false;

  constructor(private calendar: NgbCalendar, public formatter: NgbDateParserFormatter, private httpClient: HttpClient, private toastr: ToastrService, private modalService: NgbModal, private _userService: UserService) {}

  isHovered(date: NgbDate) {
    return this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
  }

  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return date.equals(this.fromDate) || (this.toDate && date.equals(this.toDate)) || this.isInside(date) || this.isHovered(date);
  }

  validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
  }

  ngOnDestroy(): void {
    this._deleteAppointmentSubscription?.unsubscribe();
    this._getAppointmentsSubscription?.unsubscribe();
    this._getCustomerListSubscription?.unsubscribe();
    this._getEmployeeListSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.isManager = this._userService.user?.isManager ?? false;
    var dateBounds = DateTimeService.getStartAndEndOfWeek(new Date());
    this.fromDate = dateBounds.start;
    this.toDate = dateBounds.end;

    this.loadAppointments();

    this._getEmployeeListSubscription = this.httpClient
      .get<EmployeeBasic[]>('https://localhost:7077/employee/baselist')
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.employees = result;
        },
        error: (error) => {
          this.toastr.error('Mitarbeiterliste konnte nicht abgerufen werden: ' + error.message);
        },
      });

    this._getCustomerListSubscription = this.httpClient
      .get<Customer[]>('https://localhost:7077/customer/list')
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.customers = result;
        },
        error: (error) => {
          this.toastr.error('Mitarbeiterliste konnte nicht abgerufen werden: ' + error.message);
        },
      });
  }

  onSelectionChanged = () => this.loadAppointments();

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date && date.after(this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
  }

  onDelete(appointment: AppointmentListEntry) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => {
      this.deleteEmployee(appointment);
    });
    modalRef.componentInstance.title = 'Kunden löschen';

    const date = appointment.date.toLocaleDateString();
    const start = DateTimeService.toTimeString(appointment.timeStart, false);
    const end = DateTimeService.toTimeString(appointment.timeEnd, false);
    modalRef.componentInstance.text = `Soll der Termin am ${date} von ${start}-${end} wirklich gelöscht werden?`;
  }

  private loadAppointments() {
    this._getAppointmentsSubscription?.unsubscribe();

    let uri = `https://localhost:7077/appointment/list?`;

    uri += this.fromDate ? `from=${DateTimeService.toDateString(this.fromDate)}&` : '';
    uri += this.toDate ? `to=${DateTimeService.toDateString(this.toDate)}&` : '';
    uri += this.isManager ? (this.selectedEmployeeId ? `employeeId=${this.selectedEmployeeId}&` : '') : `employeeId=${this._userService.user?.id}&`;
    uri += this.selectedCustomerId ? `customerId=${this.selectedCustomerId}&` : '';

    uri = uri.slice(0, -1);

    this._getAppointmentsSubscription = this.httpClient
      .get<AppointmentListEntry[]>(uri)
      .pipe(
        map((result) => result.map((entry) => this.deserializeDates(entry))),
        first()
      )
      .subscribe({
        next: (result) => {
          this.appointments = result;
        },
        error: (error) => {
          this.toastr.error('Termine konnten nicht abgerufen werden: ' + error.message);
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

  private deleteEmployee(appointment: AppointmentListEntry) {
    this._deleteAppointmentSubscription?.unsubscribe();
    this._deleteAppointmentSubscription = this.httpClient.delete(`https://localhost:7077/appointment/${appointment.id}`).subscribe({
      complete: () => {
        this.toastr.success(`Der Termin wurde gelöscht.`);
        this.appointments = this.appointments.filter((e) => e.id !== appointment.id);
      },
      error: (error) => {
        this.toastr.error('Termin konnte nicht gelöscht werden: ' + error.message);
      },
    });
  }
}
