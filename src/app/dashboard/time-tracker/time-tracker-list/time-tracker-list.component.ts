import { AsyncPipe } from '@angular/common';
import { Component, Signal, WritableSignal, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkingHoursReportStatus } from '@curacaru/enums/working-hours-report-status';
import { WorkingHoursReportListEntry } from '@curacaru/models/working-time-list-entry.model';
import { MonthNamePipe } from '@curacaru/pipes/month-name.pipe';
import { DateTimeService, UserService } from '@curacaru/services';
import { WorkingTimeService } from '@curacaru/services/working-time.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload, faFileSignature, faGear } from '@fortawesome/free-solid-svg-icons';
import { UUID } from 'angular2-uuid';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Observable, combineLatest, finalize, map, mergeMap, startWith } from 'rxjs';

@Component({
  imports: [AsyncPipe, RouterModule, FormsModule, MonthNamePipe, NgxSkeletonLoaderModule, FontAwesomeModule],
  selector: 'cura-time-tracker-list',
  standalone: true,
  templateUrl: './time-tracker-list.component.html',
})
export class TimeTrackerListComponent {
  private readonly workingTimeService = inject(WorkingTimeService);
  private readonly userService = inject(UserService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  months = DateTimeService.months;
  WorkingHoursReportStatus = WorkingHoursReportStatus;
  faGear = faGear;
  faFileSignature = faFileSignature;
  faDownload = faDownload;

  readonly selectedMonth = signal(new Date().getMonth() + 1);
  readonly selectedYear = signal(new Date().getFullYear());
  readonly isLoading = signal(false);
  readonly isManager = signal(false);
  readonly userId: WritableSignal<UUID> = signal('');

  readonly workingTimeList$: Observable<WorkingHoursReportListEntry[]>;

  constructor() {
    this.workingTimeList$ = combineLatest({ user: this.userService.user$, queryParams: this.activatedRoute.queryParams }).pipe(
      map((result) => {
        this.selectedMonth.set(parseInt(result.queryParams['month']) || new Date().getMonth() + 1);
        this.selectedYear.set(parseInt(result.queryParams['year']) || new Date().getFullYear());
        this.isLoading.set(true);
        this.isManager.set(result.user.isManager);
        this.userId.set(result.user.id);
      }),
      mergeMap(() =>
        this.workingTimeService.getWorkTimeList(this.selectedYear(), this.selectedMonth()).pipe(
          startWith([]),
          finalize(() => this.isLoading.set(false))
        )
      )
    );
  }

  onSelectedMonthChange(selectedDate: string) {
    this.router.navigate([], { queryParams: { month: selectedDate }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  onSelectedYearChange(selectedYear: string) {
    this.selectedYear.set(parseInt(selectedYear) || new Date().getFullYear());
    if (this.selectedYear() > 2020 && this.selectedYear() < 2100) {
      this.router.navigate([], { queryParams: { year: this.selectedYear() }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }
}
