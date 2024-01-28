import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faTrashCan, faUser } from '@fortawesome/free-regular-svg-icons';
import { faCheck, faFileSignature, faGear, faHouse, faLocationDot, faUserAlt } from '@fortawesome/free-solid-svg-icons';
import { NgbCalendar, NgbCollapseModule, NgbDate, NgbDateParserFormatter, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subscription, first, map } from 'rxjs';
import { GermanDateParserFormatter } from '../../../i18n/date-formatter';
import { NgbdModalConfirm } from '../../../modals/confirm-modal/confirm-modal.component';
import { AppointmentListEntry } from '../../../models/appointment-list-entry.model';
import { Customer } from '../../../models/customer.model';
import { EmployeeBasic } from '../../../models/employee-basic.model';
import { TimeFormatPipe } from '../../../pipes/time.pipe';
import { DateTimeService } from '../../../services/date-time.service';
import { UserService } from '../../../services/user.service';
import { ApiService } from '../../../services/api.service';
import { CustomerListEntry } from '../../../models/customer-list-entry.model';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ReplacePipe } from '@curacaru/pipes/replace.pipe';

@Component({
  imports: [CommonModule, FontAwesomeModule, RouterModule, NgbDatepickerModule, NgxSkeletonLoaderModule, FormsModule, TimeFormatPipe, ReplacePipe, NgbCollapseModule],
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }, ApiService],
  selector: 'cura-appointments-list',
  standalone: true,
  styleUrls: ['./appointments-list.component.scss'],
  templateUrl: './appointments-list.component.html',
})
export class AppointmentsListComponent implements OnDestroy, OnInit {
  faGear = faGear;
  faHouse = faHouse;
  faUser = faUser;
  faUserSolid = faUserAlt;
  faTrashCan = faTrashCan;
  faCalendar = faCalendar;
  faCheck = faCheck;
  faFileSignature = faFileSignature;
  faLocationDot = faLocationDot;

  appointments: AppointmentListEntry[] = [];
  customers: CustomerListEntry[] = [];
  employees: EmployeeBasic[] = [];
  fromDate: NgbDate | null = this.calendar.getToday();
  hoveredDate: NgbDate | null = null;
  isLoading: boolean = true;
  isManager: boolean = false;
  selectedCustomer?: Customer;
  selectedCustomerId?: number;
  selectedEmployee?: EmployeeBasic;
  selectedEmployeeId?: number;
  toDate: NgbDate | null = this.calendar.getToday();
  isCollapsed = true;

  private deleteAppointmentSubscription?: Subscription;
  private getAppointmentsSubscription?: Subscription;
  private getEmployeeListSubscription?: Subscription;
  private getCustomerListSubscription?: Subscription;
  private postFinishSubscription?: Subscription;

  constructor(private apiService: ApiService, private calendar: NgbCalendar, public formatter: NgbDateParserFormatter, private modalService: NgbModal, private toastr: ToastrService, private userService: UserService) {}

  ngOnDestroy(): void {
    this.deleteAppointmentSubscription?.unsubscribe();
    this.getAppointmentsSubscription?.unsubscribe();
    this.getCustomerListSubscription?.unsubscribe();
    this.getEmployeeListSubscription?.unsubscribe();
    this.postFinishSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.isManager = this.userService.user?.isManager ?? false;
    var dateBounds = DateTimeService.getStartAndEndOfWeek(new Date());
    this.fromDate = dateBounds.start;
    this.toDate = dateBounds.end;

    this.isLoading = true;
    this.loadAppointments();

    this.getEmployeeListSubscription = this.apiService.getEmployeeBaseList().subscribe({
      next: (result) => {
        this.employees = result;
      },
      error: (error) => {
        this.toastr.error(`Mitarbeiterliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
      },
    });

    this.getCustomerListSubscription = this.apiService.getCustomerList().subscribe({
      next: (result) => {
        this.customers = result;
      },
      error: (error) => {
        this.toastr.error(`Mitarbeiterliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
      },
    });
  }

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
    uri += this.isManager ? (this.selectedEmployeeId ? `employeeId=${this.selectedEmployeeId}&` : '') : `employeeId=${this.userService.user?.id}&`;
    uri += this.selectedCustomerId ? `customerId=${this.selectedCustomerId}&` : '';
    uri = uri.slice(0, -1);

    this.getAppointmentsSubscription?.unsubscribe();
    this.getAppointmentsSubscription = this.apiService
      .getAppointmentList(uri)
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
    this.postFinishSubscription?.unsubscribe();
    this.postFinishSubscription = this.apiService.finishAppointment(appointment.id!).subscribe({
      complete: () => {
        this.toastr.success('Termin wurde abgeschlossen');
        appointment.isDone = true;
      },
      error: (error) => {
        this.toastr.error(`Termin konnte nicht abgeschlossen werden: [${error.status}] ${error.error}`);
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
    this.deleteAppointmentSubscription?.unsubscribe();
    this.deleteAppointmentSubscription = this.apiService.deleteAppointment(appointment.id).subscribe({
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
