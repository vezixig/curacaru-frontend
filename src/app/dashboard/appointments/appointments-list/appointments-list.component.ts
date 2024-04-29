import { CommonModule } from '@angular/common';
import { Component, OnDestroy, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faTrashCan, faUser } from '@fortawesome/free-regular-svg-icons';
import {
  faCakeCandles,
  faCheck,
  faCircleInfo,
  faFileSignature,
  faGear,
  faHouse,
  faLocationDot,
  faPhone,
  faSignature,
  faUnlock,
  faUserAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
  NgbCalendar,
  NgbCollapseModule,
  NgbDate,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbModal,
  NgbOffcanvas,
} from '@ng-bootstrap/ng-bootstrap';
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
import { AppointmentListActions, AppointmentListState } from '@curacaru/state/appointment-list.state';
import { Store } from '@ngrx/store';
import { AppointmentRepository } from '@curacaru/services/repositories/appointment.repository';
import { SignatureComponent } from '@curacaru/shared/signature/signature.component';

@Component({
  imports: [
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    NgbCollapseModule,
    NgbDatePipe,
    NgbDatepickerModule,
    NgxSkeletonLoaderModule,
    ReactiveFormsModule,
    ReplacePipe,
    RouterModule,
    SignatureComponent,
    TimeFormatPipe,
  ],
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }, ApiService],
  selector: 'cura-appointments-list',
  standalone: true,
  styleUrls: ['./appointments-list.component.scss'],
  templateUrl: './appointments-list.component.html',
})
export class AppointmentsListComponent implements OnDestroy {
  /** injections */
  private readonly apiService = inject(ApiService);
  private readonly appointmentRepository = inject(AppointmentRepository);
  private readonly calendar = inject(NgbCalendar);
  private readonly formBuilder = inject(FormBuilder);
  private readonly locationService = inject(LocationService);
  private readonly modalService = inject(NgbModal);
  private readonly offcanvasService = inject(NgbOffcanvas);
  private readonly store = inject(Store<AppointmentListState>);
  private readonly toastr = inject(ToastrService);
  private readonly userService = inject(UserService);
  public readonly formatter = inject(NgbDateParserFormatter);

  /** relays  */
  DateTimeService = DateTimeService;
  beginOfCurrentMonth = DateTimeService.beginOfCurrentMonth;
  faCakeCandles = faCakeCandles;
  faCalendar = faCalendar;
  faCheck = faCheck;
  faCircleInfo = faCircleInfo;
  faFileSignature = faFileSignature;
  faGear = faGear;
  faHouse = faHouse;
  faLocationDot = faLocationDot;
  faPhone = faPhone;
  faSignature = faSignature;
  faTrashCan = faTrashCan;
  faUnlock = faUnlock;
  faUser = faUser;
  faUserSolid = faUserAlt;

  /** properties  */
  @ViewChild('signature') signatureTemplate!: TemplateRef<any>;
  hoveredDate: NgbDate | null = null;
  isLoading = true;
  isCollapsed = true;
  today = new Date();
  fromDate?: NgbDate;
  toDate?: NgbDate;
  ngbDatePipe = new NgbDatePipe();
  readonly signatureName = signal('');
  readonly signatureTitle = signal('');

  readonly showPriceInfo$: Observable<boolean>;
  readonly filterModel$: Observable<{
    employees: EmployeeBasic[];
    customers: CustomerListEntry[];
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
    this.showPriceInfo$ = this.apiService.getCompanyPrices().pipe(map((result) => result.pricePerHour == 0));

    this.filterModel$ = forkJoin({
      employees: this.apiService.getEmployeeBaseList(),
      customers: this.apiService.getCustomerList(),
      user: this.userService.user$,
    }).pipe(
      catchError((error) => {
        this.toastr.error(`Daten konnten nicht abgerufen werden: [${error.status}] ${error.error}`);
        return EMPTY;
      })
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
        this.store.dispatch(AppointmentListActions.changeEmployeeFilter({ employeeId: next }));
      });
    this.filterForm
      .get('customerId')!
      .valueChanges.pipe(takeUntil(this.$onDestroy))
      .subscribe((next) => {
        this.store.dispatch(AppointmentListActions.changeCustomerFilter({ customerId: next }));
      });

    // Data Model
    this.dataModel$ = combineLatest({
      filter: this.filterModel$,
      state: this.store,
      refresh: this.$onRefresh.pipe(startWith(true)),
    }).pipe(
      tap(() => (this.isLoading = true)),
      switchMap((next) => {
        if (next.state.appointmentList.dateStart != this.filterForm.get('start')?.value) {
          this.filterForm.patchValue({ start: next.state.appointmentList.dateStart }, { emitEvent: false });
          this.fromDate = next.state.appointmentList.dateStart;
        }

        if (next.state.appointmentList.dateEnd != this.filterForm.get('end')?.value) {
          this.filterForm.patchValue({ end: next.state.appointmentList.dateEnd }, { emitEvent: false });
          this.toDate = next.state.appointmentList.dateEnd;
        }

        if (next.filter.user.isManager && next.state.appointmentList.employeeId != this.filterForm.get('employeeId')?.value) {
          this.filterForm.patchValue({ employeeId: next.state.appointmentList.employeeId }, { emitEvent: false });
        }

        if (next.state.appointmentList.customerId != this.filterForm.get('customerId')?.value) {
          this.filterForm.patchValue({ customerId: next.state.appointmentList.customerId }, { emitEvent: false });
        }

        return this.apiService
          .getAppointmentList(
            this.filterForm.get('start')?.value ?? dateBounds.start,
            this.filterForm.get('end')?.value ?? dateBounds.end,
            this.filterForm.get('customerId')?.value,
            next.filter.user.isManager ? this.filterForm.get('employeeId')?.value : undefined
          )
          .pipe(
            map((appointments) => ({
              appointments: appointments.map(this.deserializeDates).map((appointment) => {
                appointment.canSign =
                  appointment.employeeReplacementId == next.filter.user.id ||
                  (!appointment.employeeReplacementId && appointment.employeeId == next.filter.user.id);
                return appointment;
              }),
            }))
          );
      }),
      catchError((error) => {
        this.toastr.error(`Termine konnten nicht abgerufen werden: [${error.status}] ${error.error}`);
        return EMPTY;
      }),
      tap(() => (this.isLoading = false))
    );
  }

  ngOnDestroy(): void {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }

  private signatureTaking?: {
    appointment: AppointmentListEntry;
    isEmployee: boolean;
  };

  onTakeSignature(appointment: AppointmentListEntry, isEmployee: boolean) {
    this.signatureTaking = { appointment, isEmployee };
    this.signatureName.set(
      isEmployee
        ? (appointment.employeeReplacementName ?? '') != ''
          ? appointment.employeeReplacementName!
          : appointment.employeeName
        : appointment.customerName
    );
    this.signatureTitle.set(isEmployee ? 'Unterschrift Mitarbeiter' : 'Unterschrift Kunde');
    this.offcanvasService.open(this.signatureTemplate, { position: 'bottom', panelClass: 'signature-panel', backdrop: 'static' });
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
      this.store.dispatch(AppointmentListActions.changeDateFilter({ dateStart: this.fromDate, dateEnd: this.toDate }));
    }
  }

  onDelete(appointment: AppointmentListEntry) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => {
      this.deleteAppointment(appointment);
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
          appointment.isSignedByCustomer = false;
          appointment.isSignedByEmployee = false;
        },
        error: (error) => {
          this.toastr.error(`Termin konnte nicht wieder geöffnet werden: [${error.status}] ${error.error}`);
        },
      });
  }

  takeSignature(template: TemplateRef<any>, name: string, isEmployee: boolean) {
    this.offcanvasService.open(template, { position: 'bottom', panelClass: 'signature-panel' });
  }

  onSignatureTaken($event: string) {
    if (this.signatureTaking == null || $event == '') return;

    var apiCall = this.signatureTaking?.isEmployee
      ? this.appointmentRepository.addEmployeeSignature(this.signatureTaking.appointment.id!, $event)
      : this.appointmentRepository.addCustomerSignature(this.signatureTaking.appointment.id!, $event);

    this.appointmentRepository;
    apiCall.pipe(takeUntil(this.$onDestroy)).subscribe({
      next: () => {
        this.signatureTaking?.isEmployee
          ? (this.signatureTaking.appointment.isSignedByEmployee = true)
          : (this.signatureTaking!.appointment.isSignedByCustomer = true);
        this.offcanvasService.dismiss();
      },
      error: (error) => {
        this.toastr.error(`Unterschrift konnte nicht gespeichert werden: [${error.status}] ${error.error}`);
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

  private deleteAppointment(appointment: AppointmentListEntry) {
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
