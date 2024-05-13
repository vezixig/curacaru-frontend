import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Component, OnDestroy, TemplateRef, inject, signal } from '@angular/core';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { AsyncPipe, CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { GermanDateParserFormatter } from '@curacaru/i18n/date-formatter';
import { InputComponent } from '@curacaru/shared/input/input.component';
import { NgbDateParserFormatter, NgbDatepickerModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Observable, Subject, combineLatest } from 'rxjs';
import { TimeFormatPipe } from '@curacaru/pipes/time.pipe';
import { ToastrService } from 'ngx-toastr';
import { UserEmployee } from '@curacaru/models';
import { WorkingHours } from '@curacaru/models/working-hours.model';
import { faCalendar, faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { faEraser, faGear } from '@fortawesome/free-solid-svg-icons';
import { finalize, map, mergeMap, shareReplay, startWith, tap } from 'rxjs/operators';
import { WorkingTimeService } from '@curacaru/services/working-time.service';
import { WorkingTimeReport } from '@curacaru/models/working-time-report.model';
import { SignatureComponent } from '@curacaru/shared/signature/signature.component';
import { AppointmentService } from '@curacaru/services/appointment.service';
import { AppointmentBase } from '@curacaru/models/appointment-base.model';
import { InfoComponent } from '@curacaru/shared/info-box/info.component';

@Component({
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }, ApiService],
  selector: 'cura-time-tracker-editor',
  standalone: true,
  templateUrl: './time-tracker-editor.component.html',
  imports: [
    AsyncPipe,
    InfoComponent,
    CommonModule,
    DatePipe,
    DecimalPipe,
    FontAwesomeModule,
    FormsModule,
    InputComponent,
    NgbDatepickerModule,
    NgxSkeletonLoaderModule,
    ReactiveFormsModule,
    RouterModule,
    SignatureComponent,
    TimeFormatPipe,
  ],
})
export class TimeTrackerEditorComponent implements OnDestroy {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toasterService = inject(ToastrService);
  private readonly userService = inject(UserService);
  private readonly workingTimeService = inject(WorkingTimeService);
  private readonly offcanvasService = inject(NgbOffcanvas);
  private readonly appointmentService = inject(AppointmentService);

  private readonly user$: Observable<UserEmployee>;
  private readonly $onDestroy = new Subject();

  faCalendar = faCalendar;
  faGear = faGear;
  faTrashCan = faTrashCan;
  faEraser = faEraser;
  months = DateTimeService.months;

  readonly canvasWidth = signal(120);
  readonly isLoadingWorkingHours = signal(false);
  readonly isManager = signal(false);
  readonly isNew = signal(false);
  readonly isSaving = signal(false);
  readonly model$: Observable<{
    workTime: WorkingHours[];
    report: WorkingTimeReport;
    totalWorkedHours: number;
    canSign: boolean;
    employeeName: string;
    userName: string;
    hasUndoneAppointments: boolean;
    hasPlannedAppointments: boolean;
  }>;
  readonly reportForm: FormGroup;
  readonly today = new Date();

  private readonly $onRefresh = new Subject();

  constructor() {
    this.reportForm = this.buildForm();

    // retrieve user
    this.user$ = this.userService.user$.pipe(
      tap((user) => {
        this.reportForm.controls['employeeId'].setValue(user.id);
      })
    );

    // retrieve working hours
    this.model$ = combineLatest({
      user: this.user$,
      queryParams: this.activatedRoute.queryParams,
      refresh: this.$onRefresh.pipe(startWith({})),
    }).pipe(
      map((result) => {
        this.reportForm.controls['month'].setValue(parseInt(result.queryParams['month']) || new Date().getMonth() + 1);
        this.reportForm.controls['year'].setValue(parseInt(result.queryParams['year']) || new Date().getFullYear());
        if (result.queryParams['employeeId']) {
          this.reportForm.controls['employeeId'].setValue(result.queryParams['employeeId']);
        }
        this.isNew.set(!result.queryParams['employeeId']);
        this.isLoadingWorkingHours.set(true);
        this.isManager.set(result.user.isManager);
        return result.user;
      }),
      mergeMap((next) => {
        // get the worked hours
        const workTime$ = this.workingTimeService
          .getWorkTime(this.reportForm.get('employeeId')!.value, this.reportForm.get('month')!.value, this.reportForm.get('year')!.value)
          .pipe(
            startWith([]),
            map((workingHours) => {
              workingHours.forEach((wh) => {
                wh.timeEnd = DateTimeService.toTime(wh.timeEnd.toString());
                wh.timeStart = DateTimeService.toTime(wh.timeStart.toString());
              });
              return workingHours;
            })
          );

        // get the employee
        const employee$ = this.apiService.getEmployee(this.reportForm.get('employeeId')!.value).pipe(shareReplay(1));

        // get the report
        const report$ = this.workingTimeService.getWorkTimeReport(
          this.reportForm.get('employeeId')!.value,
          this.reportForm.get('year')!.value,
          this.reportForm.get('month')!.value
        );

        return combineLatest({ workTime: workTime$, report: report$, employee: employee$ }).pipe(
          map((result) => {
            this.reportForm.controls['employeeName'].setValue(result.employee.firstName + ' ' + result.employee.lastName);
            return {
              report: result.report,
              workTime: result.workTime,
              totalWorkedHours: result.workTime.map(this.timeDiff).reduce((acc, value) => acc + value / 60, 0),
              canSign: result.workTime.length > 0 && result.workTime.findIndex((o) => o.isDone == false) == -1,
              employeeName: result.employee.firstName + ' ' + result.employee.lastName,
              userName: next.firstName + ' ' + next.lastName,
              hasUndoneAppointments: result.workTime.findIndex((o) => o.isDone == false && o.isPlanned == false) > -1,
              hasPlannedAppointments: result.workTime.findIndex((o) => o.isPlanned == true) > -1,
            };
          }),
          finalize(() => {
            this.isLoadingWorkingHours.set(false);
          })
        );
      })
    );
  }

  openOffCanvas(template: TemplateRef<any>) {
    this.offcanvasService.open(template, { position: 'bottom', panelClass: 'signature-panel' });
  }

  ngOnDestroy(): void {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }

  onSelectedMonthChange(selectedDate: string) {
    this.router.navigate([], { queryParams: { month: selectedDate }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  onSelectedYearChange(selectedYear: string) {
    const year = parseInt(selectedYear) || new Date().getFullYear();
    if (year > 2020 && year < 2100) {
      this.router.navigate([], { queryParams: { year: year }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }

  onSigned($event: string) {
    this.reportForm.get('signature')!.setValue($event);
    this.onSave();
  }

  onDeleteAppointment(workingHours: WorkingHours) {
    var appointment: AppointmentBase = { ...workingHours, date: DateTimeService.toDate(workingHours.date.toString()) };
    console.log(appointment);
    this.appointmentService.DeleteAppointment(appointment, this.$onRefresh);
  }

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      employeeId: ['', { Validators: Validators.required }],
      employeeName: ['', { Validators: Validators.required }],
      signatureCity: ['', [Validators.required, Validators.maxLength(30)]],
      signature: [''],
      year: [],
      month: [],
    });
  }

  /** Calculates the difference between start and end of working time in hours */
  private timeDiff = (workingHour: WorkingHours): number =>
    workingHour.timeEnd.hours * 60 + workingHour.timeEnd.minutes - (workingHour.timeStart.hours * 60 + workingHour.timeStart.minutes);

  public onSave() {
    this.isSaving.set(true);
    this.workingTimeService
      .signWorkingTimeReport(this.reportForm.value)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (_) => {
          this.toasterService.success('Unterschrift der Arbeitszeiterfassung erfolgreich gespeichert');
          this.router.navigate(['/dashboard/time-tracker']);
        },
        error: (error) => this.toasterService.error(`Einsatznachweis konnte nicht heruntergeladen werden: [${error.status}] ${error.error}`),
      });
  }
}
