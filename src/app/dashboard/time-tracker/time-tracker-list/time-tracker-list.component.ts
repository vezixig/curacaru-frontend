import { AsyncPipe } from '@angular/common';
import { Component, WritableSignal, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WorkingHoursReportStatus } from '@curacaru/enums/working-hours-report-status';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { WorkingHoursReportListEntry } from '@curacaru/models/working-time-list-entry.model';
import { MonthNamePipe } from '@curacaru/pipes/month-name.pipe';
import { DateTimeService, UserService } from '@curacaru/services';
import { WorkingTimeService } from '@curacaru/services/working-time.service';
import { TimeTrackerActions } from '@curacaru/state/time-tracker.state';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo, faDownload, faFileSignature, faGear } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, combineLatest, finalize, map, mergeMap, startWith } from 'rxjs';
import { PagingComponent } from '../../../shared/paging/paging.component';
import { Page } from '@curacaru/models/page.model';

@Component({
  providers: [MonthNamePipe],
  selector: 'cura-time-tracker-list',
  standalone: true,
  templateUrl: './time-tracker-list.component.html',
  imports: [AsyncPipe, RouterModule, FormsModule, MonthNamePipe, NgxSkeletonLoaderModule, FontAwesomeModule, PagingComponent],
})
export class TimeTrackerListComponent {
  private readonly toastr = inject(ToastrService);
  private readonly userService = inject(UserService);
  private readonly workingTimeService = inject(WorkingTimeService);
  private readonly modalService = inject(NgbModal);
  private readonly monthNamePipe = inject(MonthNamePipe);
  private readonly store = inject(Store);

  WorkingHoursReportStatus = WorkingHoursReportStatus;
  faCalendar = faCalendar;
  faCircleInfo = faCircleInfo;
  faDownload = faDownload;
  faFileSignature = faFileSignature;
  faGear = faGear;
  faTrashCan = faTrashCan;
  months = DateTimeService.months;

  readonly isLoading = signal(false);
  readonly isManager = signal(false);
  readonly selectedMonth = signal(new Date().getMonth() + 1);
  readonly selectedYear = signal(new Date().getFullYear());
  readonly userId: WritableSignal<UUID> = signal('');
  readonly workingTimeList$: Observable<Page<WorkingHoursReportListEntry>>;
  readonly $onRefresh = new Subject();

  constructor() {
    this.workingTimeList$ = combineLatest({
      user: this.userService.user$,
      state: this.store,
      refresh: this.$onRefresh.pipe(startWith(null)),
    }).pipe(
      map((result) => {
        this.selectedMonth.set(result.state.timeTracker.month);
        this.selectedYear.set(result.state.timeTracker.year);
        this.isLoading.set(true);
        this.isManager.set(result.user.isManager);
        this.userId.set(result.user.id);
        return result;
      }),
      mergeMap((result) =>
        this.workingTimeService
          .getWorkTimeList(this.selectedYear(), this.selectedMonth(), result.state.timeTracker.page)
          .pipe(finalize(() => this.isLoading.set(false)))
      )
    );
  }

  onDeleteReport(report: WorkingHoursReportListEntry) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteReport(report));
    modalRef.componentInstance.title = 'Arbeitszeiterfassung löschen';
    modalRef.componentInstance.text = `Soll die Arbeitszeiterfassung von ${report.employeeName} für ${this.monthNamePipe.transform(report.month)} ${
      report.year
    } wirklich gelöscht werden?`;
  }

  onDownloadReport(report: WorkingHoursReportListEntry) {
    this.workingTimeService.getPrintReport(report.employeeId, report.year, report.month).subscribe({
      next: (result) => {
        const blob = new Blob([result], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Arbeitszeiterfassung - ${report.employeeName}.pdf`;
        link.click();
      },
      error: (error) => {
        this.toastr.error(`Arbeitszeiterfassung  konnte nicht heruntergeladen werden: [${error.status}] ${error.error}`);
      },
    });
  }

  onPageChange($event: number) {
    this.store.dispatch(TimeTrackerActions.changePage({ page: $event }));
  }

  onSelectedMonthChange(selectedDate: string) {
    this.selectedMonth.set(parseInt(selectedDate) || new Date().getMonth() + 1);
    this.store.dispatch(TimeTrackerActions.changeMonth({ month: this.selectedMonth() }));
  }

  onSelectedYearChange(selectedYear: string) {
    this.selectedYear.set(parseInt(selectedYear) || new Date().getFullYear());
    if (this.selectedYear() > 2020 && this.selectedYear() < 2100) {
      this.store.dispatch(TimeTrackerActions.changeYear({ year: this.selectedYear() }));
    }
  }

  private deleteReport(report: WorkingHoursReportListEntry) {
    this.isLoading.set(true);
    this.workingTimeService.deleteWorkingTimeReport(report.id).subscribe({
      next: () => {
        this.toastr.success('Arbeitszeiterfassung wurde gelöscht');
        this.$onRefresh.next(true);
      },
      error: (error) => {
        this.toastr.error(`Arbeitszeiterfassung konnte nicht gelöscht werden: [${error.status}] ${error.error}`);
        this.isLoading.set(false);
      },
    });
  }
}
