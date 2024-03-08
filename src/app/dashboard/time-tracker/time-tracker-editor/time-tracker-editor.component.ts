import SignaturePad from 'signature_pad';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { GermanDateParserFormatter } from '@curacaru/i18n/date-formatter';
import { InputComponent } from '@curacaru/shared/input/input.component';
import { NgbDateParserFormatter, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Observable, Subject, combineLatest, fromEvent } from 'rxjs';
import { TimeFormatPipe } from '@curacaru/pipes/time.pipe';
import { ToastrService } from 'ngx-toastr';
import { UserEmployee } from '@curacaru/models';
import { WorkingHours } from '@curacaru/models/working-hours.model';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faEraser } from '@fortawesome/free-solid-svg-icons';
import { finalize, map, mergeMap, startWith, takeUntil, tap } from 'rxjs/operators';

@Component({
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }, ApiService],
  selector: 'cura-time-tracker-editor',
  standalone: true,
  templateUrl: './time-tracker-editor.component.html',
  styleUrls: ['./time-tracker-editor.component.scss'],
  imports: [
    AsyncPipe,
    DatePipe,
    TimeFormatPipe,
    FontAwesomeModule,
    DecimalPipe,
    FormsModule,
    InputComponent,
    ReactiveFormsModule,
    RouterModule,
    NgxSkeletonLoaderModule,
    NgbDatepickerModule,
  ],
})
export class TimeTrackerEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasElement!: ElementRef;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly toasterService = inject(ToastrService);

  faCalendar = faCalendar;
  faEraser = faEraser;
  months = DateTimeService.months;

  private readonly user$: Observable<UserEmployee>;
  private readonly $onDestroy = new Subject();
  private signaturePad!: SignaturePad;

  readonly canvasWidth = signal(120);
  readonly isLoadingWorkingHours = signal(false);
  readonly isNew$: Observable<boolean>;
  readonly reportForm: FormGroup;
  readonly selectedMonth = signal(new Date().getMonth() + 1);
  readonly selectedYear = signal(new Date().getFullYear());
  readonly totalWorkingHours$: Observable<number>;
  readonly workingHours$: Observable<WorkingHours[]>;

  constructor() {
    this.isNew$ = this.activatedRoute.url.pipe(map((urlSegments) => urlSegments[urlSegments.length - 1].path === 'new'));
    this.reportForm = this.buildForm();

    // retrieve user
    this.user$ = this.userService.user$.pipe(
      tap((user) => {
        this.reportForm.controls['employeeId'].setValue(user.id);
        this.reportForm.controls['employeeName'].setValue(user.firstName + ' ' + user.lastName);
      })
    );

    // retrieve working hours
    this.workingHours$ = combineLatest({ user: this.user$, queryParams: this.activatedRoute.queryParams }).pipe(
      map((result) => {
        this.selectedMonth.set(parseInt(result.queryParams['month']) || new Date().getMonth() + 1);
        this.selectedYear.set(parseInt(result.queryParams['year']) || new Date().getFullYear());
        this.isLoadingWorkingHours.set(true);
        return result.user;
      }),
      mergeMap((user) => {
        return this.apiService.getWorkTime(user!.id, this.selectedMonth(), this.selectedYear()).pipe(
          startWith([]),
          map((workingHours) => {
            workingHours.forEach((wh) => {
              wh.timeEnd = DateTimeService.toTime(wh.timeEnd.toString());
              wh.timeStart = DateTimeService.toTime(wh.timeStart.toString());
            });
            return workingHours;
          }),
          finalize(() => this.isLoadingWorkingHours.set(false))
        );
      })
    );

    // calculate total working hours
    this.totalWorkingHours$ = this.workingHours$.pipe(
      map((workingHours) => workingHours.map(this.timeDiff)),
      map((timeDifferences) => timeDifferences.reduce((acc, value) => acc + value / 60, 0)),
      startWith(0)
    );
  }

  ngAfterViewInit() {
    this.signaturePad = new SignaturePad(this.canvasElement.nativeElement);

    // resize the canvas to fit container - using css will only stretch the signature
    fromEvent(window, 'resize')
      .pipe(startWith([]), takeUntil(this.$onDestroy))
      .subscribe(() => {
        this.canvasWidth.set(this.canvasContainer.nativeElement.offsetWidth);
      });
  }

  ngOnDestroy(): void {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }

  onSelectedMonthChange(selectedDate: string) {
    this.router.navigate([], { queryParams: { month: selectedDate }, queryParamsHandling: 'merge' });
  }

  onSelectedYearChange(selectedYear: string) {
    this.selectedYear.set(parseInt(selectedYear) || new Date().getFullYear());
    if (this.selectedYear() > 2020 && this.selectedYear() < 2100) {
      this.router.navigate([], { queryParams: { year: this.selectedYear() }, queryParamsHandling: 'merge' });
    }
  }

  onClearSignatureClick() {
    this.signaturePad.clear();
  }

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      employeeId: ['', { Validators: Validators.required }],
      employeeName: ['', { Validators: Validators.required }],
      signatureDate: [DateTimeService.toNgbDate(new Date()), { Validators: Validators.required, updateOn: 'blur' }],
      signatureCity: ['', [Validators.required]],
    });
  }

  /** Calculates the difference between start and end of working time in hours */
  private timeDiff = (workingHour: WorkingHours): number =>
    workingHour.timeEnd.hours * 60 + workingHour.timeEnd.minutes - (workingHour.timeStart.hours * 60 + workingHour.timeStart.minutes);

  public onSave() {
    if (this.signaturePad.isEmpty()) {
      this.toasterService.error('Bitte unterschreibe den Report');
      return;
    }
  }
}
