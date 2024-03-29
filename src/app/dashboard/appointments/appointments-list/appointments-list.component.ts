import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faTrashCan, faUser } from '@fortawesome/free-regular-svg-icons';
import { faCheck, faCircleInfo, faFileSignature, faGear, faHouse, faLocationDot, faPhone, faUserAlt } from '@fortawesome/free-solid-svg-icons';
import { NgbCalendar, NgbCollapseModule, NgbDate, NgbDateParserFormatter, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, Observable, Subject, catchError, combineLatest, finalize, forkJoin, map, startWith, switchMap, takeUntil, tap } from 'rxjs';
import { GermanDateParserFormatter } from '../../../i18n/date-formatter';
import { NgbdModalConfirm } from '../../../modals/confirm-modal/confirm-modal.component';
import { AppointmentListEntry } from '../../../models/appointment-list-entry.model';
import { EmployeeBasic } from '../../../models/employee-basic.model';
import { TimeFormatPipe } from '../../../pipes/time.pipe';
import { CustomerListEntry } from '../../../models/customer-list-entry.model';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ReplacePipe } from '@curacaru/pipes/replace.pipe';
import { ApiService, DateTimeService, LocationService, UserService } from '@curacaru/services';
import { UserEmployee } from '@curacaru/models';
import { NgbDatePipe } from '@curacaru/pipes/ngb-date-pipe';

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
    NgbDatePipe,
    NgbCollapseModule,
    ReactiveFormsModule,
  ],
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }, ApiService],
  selector: 'cura-appointments-list',
  standalone: true,
  styleUrls: ['./appointments-list.component.scss'],
  templateUrl: './appointments-list.component.html',
})
export class AppointmentsListComponent implements OnDestroy {
  /** injections */
  public readonly formatter = inject(NgbDateParserFormatter);
  private readonly apiService = inject(ApiService);
  private readonly calendar = inject(NgbCalendar);
  private readonly locationService = inject(LocationService);
  private readonly modalService = inject(NgbModal);
  private readonly toastr = inject(ToastrService);
  private readonly userService = inject(UserService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

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
  hoveredDate: NgbDate | null = null;
  isLoading = true;

  isCollapsed = true;
  today = new Date();
  fromDate?: NgbDate;
  toDate?: NgbDate;
  ngbDatePipe = new NgbDatePipe();

  readonly filterModel$: Observable<{
    employees: EmployeeBasic[];
    customers: CustomerListEntry[];
    showPriceInfo: boolean;
    user: UserEmployee;
  }>;
  readonly dataModel$: Observable<{
    appointments: AppointmentListEntry[];
  }>;
  readonly filterForm: FormGroup;

  /** fields  */
  private $onDestroy = new Subject();
  private $onRefresh = new Subject();

  constructor() {
    this.filterModel$ = forkJoin({
      employees: this.apiService.getEmployeeBaseList(),
      customers: this.apiService.getCustomerList(),
      showPriceInfo: this.apiService.getCompanyPrices().pipe(map((result) => result.pricePerHour == 0)),
      user: this.userService.user$,
    }).pipe(
      tap(() => (this.isLoading = true)),
      catchError((error) => {
        this.toastr.error(`Daten konnten nicht abgerufen werden: [${error.status}] ${error.error}`);
        return EMPTY;
      }),
      finalize(() => (this.isLoading = false))
    );

    // Filter Form
    var dateBounds = DateTimeService.getStartAndEndOfWeek(new Date());
    this.fromDate = dateBounds.start;
    this.toDate = dateBounds.end;

    this.filterForm = this.formBuilder.group({
      employeeId: [undefined],
      customerId: [undefined],
      start: [dateBounds.start],
      end: [dateBounds.end],
    });

    this.filterForm
      .get('employeeId')!
      .valueChanges.pipe(takeUntil(this.$onDestroy))
      .subscribe((next) => {
        this.router.navigate([], { queryParams: { employeeId: next == '' ? undefined : next }, queryParamsHandling: 'merge' });
      });
    this.filterForm
      .get('customerId')!
      .valueChanges.pipe(takeUntil(this.$onDestroy))
      .subscribe((next) => {
        this.router.navigate([], { queryParams: { customerId: next == '' ? undefined : next }, queryParamsHandling: 'merge' });
      });

    // Data Model
    this.dataModel$ = combineLatest({
      queryParams: this.activatedRoute.queryParams,
      filter: this.filterModel$,
      refresh: this.$onRefresh.pipe(startWith(true)),
    }).pipe(
      tap(() => (this.isLoading = true)),
      switchMap((next) => {
        if (next.queryParams['from'] && next.queryParams['from'] != this.filterForm.get('start')?.value) {
          this.filterForm.patchValue({ start: DateTimeService.toNgbDate(next.queryParams['from']) }, { emitEvent: false });
          this.fromDate = DateTimeService.toNgbDate(next.queryParams['from']);
        }

        if (next.queryParams['to'] && next.queryParams['to'] != this.filterForm.get('end')?.value) {
          this.filterForm.patchValue({ end: DateTimeService.toNgbDate(next.queryParams['to']) }, { emitEvent: false });
          this.toDate = DateTimeService.toNgbDate(next.queryParams['to']);
        }

        if (next.queryParams['customerId'] != this.filterForm.get('customerId')?.value) {
          this.filterForm.patchValue({ customerId: next.queryParams['customerId'] }, { emitEvent: false });
        }

        if (next.filter.user.isManager && next.queryParams['employeeId'] != this.filterForm.get('employeeId')?.value) {
          this.filterForm.patchValue({ employeeId: next.queryParams['employeeId'] }, { emitEvent: false });
        }

        return this.apiService
          .getAppointmentList(
            this.filterForm.get('start')?.value ?? dateBounds.start,
            this.filterForm.get('end')?.value ?? dateBounds.end,
            this.filterForm.get('customerId')?.value,
            next.filter.user.isManager ? this.filterForm.get('employeeId')?.value : undefined
          )
          .pipe(map((appointments) => ({ appointments: appointments.map(this.deserializeDates) })));
      }),
      catchError((error) => {
        this.toastr.error(`Termine konnten nicht abgerufen werden: [${error.status}] ${error.error}`);
        return EMPTY;
      }),
      finalize(() => (this.isLoading = false))
    );
  }

  ngOnDestroy(): void {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }

  onOpenAppointmentLocation = (appointment: AppointmentListEntry) =>
    this.locationService.openLocationLink(`${appointment.street} ${appointment.zipCode} ${appointment.city}`);

  isHovered = (date: NgbDate) => this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
  isInside = (date: NgbDate) => this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  isRange = (date: NgbDate) => date.equals(this.fromDate) || (this.toDate && date.equals(this.toDate)) || this.isInside(date) || this.isHovered(date);

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date && (date.equals(this.fromDate) || date.after(this.fromDate))) {
      this.toDate = date;
    } else {
      this.toDate = undefined;
      this.fromDate = date;
    }

    if (this.fromDate && this.toDate && (this.toDate.equals(this.fromDate) || this.toDate.after(this.fromDate))) {
      this.filterForm.patchValue({ start: this.fromDate, end: this.toDate });
      this.router.navigate([], {
        queryParams: { from: DateTimeService.toDateString(this.fromDate), to: DateTimeService.toDateString(this.toDate) },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
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

  private deserializeDates(obj: any): AppointmentListEntry {
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
          this.$onRefresh.next(true);
        },
        error: (error) => {
          this.toastr.error(`Termin konnte nicht gelöscht werden: [${error.status}] ${error.error}`);
        },
      });
  }
}
