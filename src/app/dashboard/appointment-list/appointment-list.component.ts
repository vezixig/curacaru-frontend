import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
import { NgbCalendar, NgbDate, NgbDateParserFormatter, NgbDateStruct, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { Subscription, first } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { faCalendar, faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { FormsModule } from '@angular/forms';
import { CustomDateParserFormatter } from '../../i18n/date-formatter';
import { AppointmentListEntry } from '../../models/appointment-list-entry.model';
import { TimeFormatPipe } from '../../pipes/time.pipe';
import { Employee } from '../../models/employee.model';
import { Customer } from '../../models/customer.model';

@Component({
  imports: [CommonModule, FontAwesomeModule, RouterModule, NgbDatepickerModule, FormsModule, TimeFormatPipe],
  selector: 'cura-appointment-list',
  standalone: true,
  providers: [{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }],
  styleUrls: ['./appointment-list.component.scss'],
  templateUrl: './appointment-list.component.html',
})
export class AppointmentListComponent implements OnDestroy, OnInit {
  public faGear = faGear;
  public faTrashCan = faTrashCan;
  public faCalendar = faCalendar;

  public appointments: AppointmentListEntry[] = [];
  public employees: Employee[] = [];
  public selectedEmployee?: Employee;
  public customers: Customer[] = [];
  public selectedCustomer?: Customer;

  private _getAppointmentsSubscription?: Subscription;
  private _getEmployeeListSubscription?: Subscription;
  private _getCustomerListSubscription?: Subscription;

  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate | null = this.calendar.getToday();
  toDate: NgbDate | null = this.calendar.getToday();
  selectedEmployeeId?: number;
  selectedCustomerId?: number;

  constructor(private calendar: NgbCalendar, public formatter: NgbDateParserFormatter, private httpClient: HttpClient, private modalService: NgbModal, private toastr: ToastrService) {}

  isHovered(date: NgbDate) {
    return this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
  }

  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return date.equals(this.fromDate) || (this.toDate && date.equals(this.toDate)) || this.isInside(date) || this.isHovered(date);
  }

  toDateString(date: NgbDate | null): string {
    return date ? `${date.year}-${date.month}-${date.day}` : '';
  }

  validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
  }

  ngOnDestroy(): void {
    this._getAppointmentsSubscription?.unsubscribe();
    this._getCustomerListSubscription?.unsubscribe();
    this._getEmployeeListSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.loadAppointments();

    this._getEmployeeListSubscription = this.httpClient
      .get<Employee[]>('https://localhost:7077/employee/list')
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

  onDelete(customer: AppointmentListEntry) {
    // const modalRef = this.modalService.open(NgbdModalConfirm);
    // modalRef.result.then(() => {
    //   this.deleteEmployee(customer);
    // });
    // modalRef.componentInstance.title = 'Kunden löschen';
    // modalRef.componentInstance.text = `Soll ${customer.firstName} ${customer.lastName} wirklich gelöscht werden?`;
  }

  private loadAppointments() {
    this._getAppointmentsSubscription?.unsubscribe();

    let uri = `https://localhost:7077/appointment/list?`;

    uri += this.fromDate ? `from=${this.toDateString(this.fromDate)}&` : '';
    uri += this.toDate ? `to=${this.toDateString(this.toDate)}&` : '';
    uri += this.selectedEmployeeId ? `employeeId=${this.selectedEmployeeId}&` : '';
    uri += this.selectedCustomerId ? `customerId=${this.selectedCustomerId}&` : '';

    uri = uri.slice(0, -1);

    this._getAppointmentsSubscription = this.httpClient
      .get<AppointmentListEntry[]>(uri)
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.appointments = result;
        },
        error: (error) => {
          this.toastr.error('Termine konnten nicht abgerufen werden: ' + error.message);
        },
      });
  }

  private deleteEmployee(customer: AppointmentListEntry) {
    // this.httpSubscription?.unsubscribe();
    // this.httpSubscription = this.httpClient.delete(`https://localhost:7077/customer/${customer.id}`).subscribe({
    //   complete: () => {
    //     this.toastr.success(`${customer.firstName} ${customer.lastName} wurde gelöscht.`);
    //     this.customers = this.customers.filter((e) => e.id !== customer.id);
    //   },
    //   error: (error) => {
    //     this.toastr.error('Mitarbeiter konnte nicht gelöscht werden: ' + error.message);
    //   },
    // });
  }
}
