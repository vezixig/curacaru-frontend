import { AsyncPipe } from '@angular/common';
import { Component, Signal, WritableSignal, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkingHoursReportStatus } from '@curacaru/enums/working-hours-report-status';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { WorkingHoursReportListEntry } from '@curacaru/models/working-time-list-entry.model';
import { MonthNamePipe } from '@curacaru/pipes/month-name.pipe';
import { DateTimeService, UserService } from '@curacaru/services';
import { WorkingTimeService } from '@curacaru/services/working-time.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo, faDownload, faFileSignature, faGear } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UUID } from 'angular2-uuid';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, Subject, combineLatest, finalize, map, mergeMap, startWith } from 'rxjs';

@Component({
  imports: [AsyncPipe, RouterModule, FormsModule, MonthNamePipe, NgxSkeletonLoaderModule, FontAwesomeModule],
  providers: [MonthNamePipe],
  selector: 'cura-time-tracker-list',
  standalone: true,
  templateUrl: './time-tracker-list.component.html',
})
export class TimeTrackerListComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly userService = inject(UserService);
  private readonly workingTimeService = inject(WorkingTimeService);
  private readonly modalService = inject(NgbModal);
  private readonly monthNamePipe = inject(MonthNamePipe);

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
  readonly workingTimeList$: Observable<WorkingHoursReportListEntry[]>;
  readonly $onRefresh = new Subject();

  constructor() {
    this.workingTimeList$ = combineLatest({
      user: this.userService.user$,
      queryParams: this.activatedRoute.queryParams,
      refresh: this.$onRefresh.pipe(startWith(null)),
    }).pipe(
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

  onSelectedMonthChange(selectedDate: string) {
    this.router.navigate([], { queryParams: { month: selectedDate }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  onSelectedYearChange(selectedYear: string) {
    this.selectedYear.set(parseInt(selectedYear) || new Date().getFullYear());
    if (this.selectedYear() > 2020 && this.selectedYear() < 2100) {
      this.router.navigate([], { queryParams: { year: this.selectedYear() }, queryParamsHandling: 'merge', replaceUrl: true });
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
