import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Component, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { AsyncPipe, CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { GermanDateParserFormatter } from '@curacaru/i18n/date-formatter';
import { InputComponent } from '@curacaru/shared/input/input.component';
import { NgbDateParserFormatter, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Observable, Subject, combineLatest } from 'rxjs';
import { TimeFormatPipe } from '@curacaru/pipes/time.pipe';
import { ToastrService } from 'ngx-toastr';
import { UserEmployee } from '@curacaru/models';
import { WorkingHours } from '@curacaru/models/working-hours.model';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo, faEraser, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { finalize, map, mergeMap, shareReplay, startWith, tap } from 'rxjs/operators';
import { WorkingTimeService } from '@curacaru/services/working-time.service';
import { Signature } from '@curacaru/shared/signature/signature.component';
import { WorkingTimeReport } from '@curacaru/models/working-time-report.model';

@Component({
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }, ApiService],
  selector: 'cura-time-tracker-editor',
  standalone: true,
  templateUrl: './time-tracker-editor.component.html',
  styleUrls: ['./time-tracker-editor.component.scss'],
  imports: [
    AsyncPipe,
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
    Signature,
    TimeFormatPipe,
  ],
})
export class TimeTrackerEditorComponent implements OnDestroy {
  @ViewChild('signature') signatureElement!: Signature;

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toasterService = inject(ToastrService);
  private readonly userService = inject(UserService);
  private readonly workingTimeService = inject(WorkingTimeService);

  private readonly user$: Observable<UserEmployee>;
  private readonly $onDestroy = new Subject();

  faCalendar = faCalendar;
  faEraser = faEraser;
  faTriangleExclamation = faTriangleExclamation;
  months = DateTimeService.months;
  faCircleInfo = faCircleInfo;

  readonly canvasWidth = signal(120);
  readonly isLoadingWorkingHours = signal(false);
  readonly isManager = signal(false);
  readonly isNew = signal(false);
  readonly isSaving = signal(false);
  readonly model$: Observable<{ workTime: WorkingHours[]; report: WorkingTimeReport; totalWorkedHours: number; canSign: boolean }>;
  readonly reportForm: FormGroup;

  constructor() {
    this.reportForm = this.buildForm();

    // retrieve user
    this.user$ = this.userService.user$.pipe(
      tap((user) => {
        this.reportForm.controls['employeeId'].setValue(user.id);
      })
    );

    // retrieve working hours
    this.model$ = combineLatest({ user: this.user$, queryParams: this.activatedRoute.queryParams }).pipe(
      map((result) => {
        this.reportForm.controls['month'].setValue(parseInt(result.queryParams['month']) || new Date().getMonth() + 1);
        this.reportForm.controls['year'].setValue(parseInt(result.queryParams['year']) || new Date().getFullYear());
        if (result.queryParams['employeeId']) {
          this.reportForm.controls['employeeId'].setValue(result.queryParams['employeeId']);
        }
        this.isNew.set(!result.queryParams['employeeId']);
        this.isLoadingWorkingHours.set(true);
        this.isManager.set(result.user.isManager);
      }),
      mergeMap(() => {
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
              canSign: result.workTime.findIndex((o) => o.isDone == false) == -1,
            };
          }),
          finalize(() => {
            this.isLoadingWorkingHours.set(false);
          })
        );
      })
    );
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

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      employeeId: ['', { Validators: Validators.required }],
      employeeName: ['', { Validators: Validators.required }],
      signatureDate: [DateTimeService.toNgbDate(new Date()), { Validators: Validators.required, updateOn: 'blur' }],
      signatureCity: ['', [Validators.required, Validators.maxLength(25)]],
      signature: [''],
      year: [],
      month: [],
    });
  }

  /** Calculates the difference between start and end of working time in hours */
  private timeDiff = (workingHour: WorkingHours): number =>
    workingHour.timeEnd.hours * 60 + workingHour.timeEnd.minutes - (workingHour.timeStart.hours * 60 + workingHour.timeStart.minutes);

  public onSave() {
    if (this.signatureElement.isEmpty()) {
      this.toasterService.error('Bitte unterschreibe den Report');
      return;
    }

    this.reportForm.controls['signature'].setValue(this.signatureElement.toDataURL());
    this.isSaving.set(true);
    this.workingTimeService
      .signWorkingTimeReport(this.reportForm.value)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe(() => this.router.navigate(['/dashboard/time-tracker']));
  }
}
