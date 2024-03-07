import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { Observable, combineLatest } from 'rxjs';
import { finalize, map, mergeMap, startWith, tap } from 'rxjs/operators';
import { InputComponent } from '@curacaru/shared/input/input.component';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { WorkingHours } from '@curacaru/models/working-hours.model';
import { TimeFormatPipe } from '@curacaru/pipes/time.pipe';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { UserEmployee } from '@curacaru/models';

@Component({
  providers: [ApiService],
  selector: 'cura-time-tracker-editor',
  standalone: true,
  templateUrl: './time-tracker-editor.component.html',
  imports: [AsyncPipe, DatePipe, TimeFormatPipe, DecimalPipe, FormsModule, InputComponent, ReactiveFormsModule, NgxSkeletonLoaderModule],
})
export class TimeTrackerEditorComponent {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly user$: Observable<UserEmployee>;

  readonly isNew$: Observable<boolean>;
  readonly months = DateTimeService.months;
  readonly reportForm: FormGroup;
  readonly selectedMonth = signal(new Date().getMonth() + 1);
  readonly selectedYear = signal(new Date().getFullYear());
  readonly workingHours$: Observable<WorkingHours[]>;
  readonly isLoadingWorkingHours = signal(false);

  constructor() {
    this.isNew$ = this.activatedRoute.url.pipe(map((urlSegments) => urlSegments[urlSegments.length - 1].path === 'new'));

    this.reportForm = this.formBuilder.group({
      employeeId: [''],
      employeeName: [''],
    });

    this.user$ = this.userService.user$.pipe(
      tap((user) => {
        this.reportForm.controls['employeeId'].setValue(user.id);
        this.reportForm.controls['employeeName'].setValue(user.firstName + ' ' + user.lastName);
      })
    );

    this.workingHours$ = combineLatest({ user: this.user$, queryParams: this.activatedRoute.queryParams }).pipe(
      map((result) => {
        this.selectedMonth.set(parseInt(result.queryParams['month']) || new Date().getMonth() + 1);
        this.selectedYear.set(parseInt(result.queryParams['year']) || new Date().getFullYear());
        return result.user;
      }),
      tap(() => this.isLoadingWorkingHours.set(true)),
      mergeMap((user) => {
        return this.apiService.getWorkTime(user!.id, this.selectedMonth(), this.selectedYear()).pipe(
          finalize(() => this.isLoadingWorkingHours.set(false)),
          startWith([])
        );
      })
    );
  }

  onSelectedMonthChange(selectedDate: string) {
    this.router.navigate([], { queryParams: { month: selectedDate }, queryParamsHandling: 'merge' });
  }

  onSelectedYearChange(selectedYear: string) {
    this.selectedYear.set(parseInt(selectedYear) || new Date().getFullYear());
    if (this.selectedYear() > 2020) {
      this.router.navigate([], { queryParams: { year: this.selectedYear() }, queryParamsHandling: 'merge' });
    }
  }

  public onSave() {
    console.log('Save');
  }
}
