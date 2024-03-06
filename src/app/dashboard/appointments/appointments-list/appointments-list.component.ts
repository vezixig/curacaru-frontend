import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faTrashCan, faUser } from '@fortawesome/free-regular-svg-icons';
import { faCheck, faCircleInfo, faFileSignature, faGear, faHouse, faLocationDot, faPhone, faUserAlt } from '@fortawesome/free-solid-svg-icons';
import { NgbCalendar, NgbCollapseModule, NgbDate, NgbDateParserFormatter, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subject, forkJoin, map, takeUntil } from 'rxjs';
import { GermanDateParserFormatter } from '../../../i18n/date-formatter';
import { NgbdModalConfirm } from '../../../modals/confirm-modal/confirm-modal.component';
import { AppointmentListEntry } from '../../../models/appointment-list-entry.model';
import { Customer } from '../../../models/customer.model';
import { EmployeeBasic } from '../../../models/employee-basic.model';
import { TimeFormatPipe } from '../../../pipes/time.pipe';
import { CustomerListEntry } from '../../../models/customer-list-entry.model';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ReplacePipe } from '@curacaru/pipes/replace.pipe';
import { ApiService, DateTimeService, LocationService, UserService } from '@curacaru/services';
import { UserEmployee } from '@curacaru/models';

@Component({
  imports: [
    CommonModule,
    FontAwesomeModule,
    RouterModule,
    NgbDatepickerModule,
    NgxSkeletonLoaderModule,
    FormsModule,
    TimeFormatPipe,
    ReplacePipe,
    NgbCollapseModule,
  ],
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }, ApiService],
  selector: 'cura-appointments-list',
  standalone: true,
  styleUrls: ['./appointments-list.component.scss'],
  templateUrl: './appointments-list.component.html',
})
export class AppointmentsListComponent implements OnDestroy, OnInit {
  /** injections */
  private apiService = inject(ApiService);
  private calendar = inject(NgbCalendar);
  public formatter = inject(NgbDateParserFormatter);
  private locationService = inject(LocationService);
  private modalService = inject(NgbModal);
  private toastr = inject(ToastrService);
  private userService = inject(UserService);

  /** relays  */
  faCalendar = faCalendar;
  faCheck = faCheck;
  faCircleInfo = faCircleInfo;
  faFileSignature = faFileSignature;
  faGear = faGear;
  faHouse = faHouse;
  faLocationDot = faLocationDot;
  faPhone = faPhone;
  faTrashCan = faTrashCan;
  faUser = faUser;
  faUserSolid = faUserAlt;
  beginOfCurrentMonth = DateTimeService.beginOfCurrentMonth;

  /** properties  */
  appointments: AppointmentListEntry[] = [];
  customers: CustomerListEntry[] = [];
  employees: EmployeeBasic[] = [];
  fromDate: NgbDate | null = this.calendar.getToday();
  hoveredDate: NgbDate | null = null;
  isLoading = true;
  selectedCustomer?: Customer;
  selectedCustomerId?: number;
  selectedEmployee?: EmployeeBasic;
  selectedEmployeeId?: number;
  showPriceInfo = false;
  toDate: NgbDate | null = this.calendar.getToday();
  isCollapsed = true;
  today = new Date();
  user?: UserEmployee;

  /** fields  */
  private $onDestroy = new Subject();

  ngOnDestroy(): void {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }

  ngOnInit(): void {
    var dateBounds = DateTimeService.getStartAndEndOfWeek(new Date());
    this.fromDate = dateBounds.start;
    this.toDate = dateBounds.end;

    this.isLoading = true;

    forkJoin({
      employees: this.apiService.getEmployeeBaseList(),
      customers: this.apiService.getCustomerList(),
      prices: this.apiService.getCompanyPrices(),
      user: this.userService.user$,
    })
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        next: (result) => {
          this.employees = result.employees;
          this.customers = result.customers;
          this.showPriceInfo = result.prices.pricePerHour == 0;
          this.user = result.user;
          this.loadAppointments();
        },
        error: (error) => {
          this.toastr.error(`Daten konnten nicht abgerufen werden: [${error.status}] ${error.error}`);
        },
      });
  }

  onOpenAppointmentLocation = (appointment: AppointmentListEntry) =>
    this.locationService.openLocationLink(`${appointment.street} ${appointment.zipCode} ${appointment.city}`);

  isHovered = (date: NgbDate) => this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
  isInside = (date: NgbDate) => this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  isRange = (date: NgbDate) => date.equals(this.fromDate) || (this.toDate && date.equals(this.toDate)) || this.isInside(date) || this.isHovered(date);

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
    modalRef.componentInstance.title = 'Termin löschen';

    const date = appointment.date.toLocaleDateString();
    const start = DateTimeService.toTimeString(appointment.timeStart, false);
    const end = DateTimeService.toTimeString(appointment.timeEnd, false);
    modalRef.componentInstance.text = `Soll der Termin am ${date} von ${start}-${end} wirklich gelöscht werden?`;
  }

  validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
  }

  private loadAppointments() {
    let uri = `?`;
    uri += this.fromDate ? `from=${DateTimeService.toDateString(this.fromDate)}&` : '';
    uri += this.toDate ? `to=${DateTimeService.toDateString(this.toDate)}&` : '';
    uri += this.user?.isManager ? (this.selectedEmployeeId ? `employeeId=${this.selectedEmployeeId}&` : '') : `employeeId=${this.user?.id}&`;
    uri += this.selectedCustomerId ? `customerId=${this.selectedCustomerId}&` : '';
    uri = uri.slice(0, -1);

    this.apiService
      .getAppointmentList(uri)
      .pipe(takeUntil(this.$onDestroy))
      .pipe(map((result) => result.map((entry) => this.deserializeDates(entry))))
      .subscribe({
        next: (result) => {
          this.appointments = result;
          this.isLoading = false;
        },
        error: (error) => {
          this.toastr.error(`Termine konnten nicht abgerufen werden: [${error.status}] ${error.error}`);
          this.isLoading = false;
        },
      });
  }

  onFinish(appointment: AppointmentListEntry) {
    this.apiService
      .finishAppointment(appointment.id!)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        complete: () => {
          this.toastr.success('Termin wurde abgeschlossen');
          appointment.isDone = true;
        },
        error: (error) => {
          this.toastr.error(`Termin konnte nicht abgeschlossen werden: [${error.status}] ${error.error}`);
        },
      });
  }

  onReopen(appointment: AppointmentListEntry) {
    this.apiService
      .reopenAppointment(appointment.id)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        complete: () => {
          this.toastr.success('Termin wurde wieder geöffnet');
          appointment.isDone = false;
        },
        error: (error) => {
          this.toastr.error(`Termin konnte nicht wieder geöffnet werden: [${error.status}] ${error.error}`);
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
    this.apiService
      .deleteAppointment(appointment.id)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        complete: () => {
          this.toastr.success(`Der Termin wurde gelöscht.`);
          this.appointments = this.appointments.filter((e) => e.id !== appointment.id);
        },
        error: (error) => {
          this.toastr.error(`Termin konnte nicht gelöscht werden: [${error.status}] ${error.error}`);
        },
      });
  }
}
