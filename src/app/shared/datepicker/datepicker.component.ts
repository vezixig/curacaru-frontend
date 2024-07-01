import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild, computed, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDate, NgbDatepickerModule, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { NgbDatePipe } from '../../pipes/ngb-date-pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DateTimeService } from '@curacaru/services';

@Component({
  selector: 'cura-datepicker',
  standalone: true,
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgbDatepickerModule, FontAwesomeModule, FormsModule, CommonModule, NgbDatePipe],
})
export class DatepickerComponent {
  @ViewChild('datepicker') datepicker!: NgbInputDatepicker;

  readonly hoveredDate = signal<NgbDate | null>(null);
  readonly fromDate = model.required<NgbDate>();
  readonly toDate = model.required<NgbDate>();
  readonly mode = model.required<number>();

  readonly dateChanged = output<{ start: NgbDate; end: NgbDate; dateMode: number }>();

  readonly dateText = computed(() => {
    if (this.mode() == 1 || (this.fromDate() && this.fromDate().equals(this.toDate()))) {
      return DateTimeService.toDate(this.fromDate()).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      });
    }
    if (this.fromDate() && this.toDate()) {
      return `${DateTimeService.toDate(this.fromDate()).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })} - ${DateTimeService.toDate(this.toDate()).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })}`;
    }
    return '';
  });

  private readonly monday = computed(() => {
    var date = DateTimeService.toDate(this.hoveredDate());
    date.setDate(date.getDay() == 0 ? date.getDate() - 6 : date.getDate() - date.getDay() + 1);
    return DateTimeService.toNgbDate(date);
  });

  private readonly sunday = computed(() => {
    var date = DateTimeService.toDate(this.hoveredDate());
    date.setDate(date.getDay() == 0 ? date.getDate() : date.getDate() + 7 - date.getDay());
    return DateTimeService.toNgbDate(date);
  });

  private readonly firstDayOfMonth = computed(() => {
    var date = DateTimeService.toDate(this.hoveredDate());
    date.setDate(1);
    return DateTimeService.toNgbDate(date);
  });

  private readonly lastDayOfMonth = computed(() => {
    var date = DateTimeService.toDate(this.hoveredDate());
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return DateTimeService.toNgbDate(date);
  });

  onDateSelection(date: NgbDate) {
    switch (this.mode()) {
      case 1:
        this.fromDate.set(date);
        this.toDate.set(date);
        break;
      case 2:
        this.fromDate.set(this.monday());
        this.toDate.set(this.sunday());
        break;
      case 3:
        this.fromDate.set(this.firstDayOfMonth());
        this.toDate.set(this.lastDayOfMonth());
        break;
    }

    this.dateChanged.emit({ start: this.fromDate(), end: this.toDate(), dateMode: this.mode() });
    this.datepicker.close();
  }

  isInside(date: NgbDate) {
    switch (this.mode()) {
      case 1:
        return false;
      case 2:
        return date.after(this.monday()) && date.before(this.sunday());
      case 3:
        return date.after(this.firstDayOfMonth()) && date.before(this.lastDayOfMonth());
    }
    return false;
  }

  isRange(ngbDate: NgbDate) {
    switch (this.mode()) {
      case 1:
        return false;
      case 2:
        return ngbDate.equals(this.monday()) || ngbDate.equals(this.sunday());
      case 3:
        return ngbDate.equals(this.firstDayOfMonth()) || ngbDate.equals(this.lastDayOfMonth());
    }
    return false;
  }

  isFocused(ngbDate: NgbDate) {
    return ngbDate.equals(this.fromDate()) || (ngbDate.after(this.fromDate()) && (ngbDate.before(this.toDate()) || ngbDate.equals(this.toDate())));
  }

  onClosed() {
    this.hoveredDate.set(null);
  }

  onOffsetDate(offset: number) {
    var startDate = new Date(this.fromDate().year, this.fromDate().month - 1, this.fromDate().day);
    var endDate = new Date(this.toDate().year, this.toDate().month - 1, this.toDate().day);

    switch (this.mode()) {
      case 1:
        startDate.setDate(startDate.getDate() + offset);
        endDate.setDate(endDate.getDate() + offset);
        break;
      case 2:
        startDate.setDate(startDate.getDate() + offset * 7);
        endDate.setDate(endDate.getDate() + offset * 7);
        break;
      case 3:
        startDate.setMonth(startDate.getMonth() + offset);
        startDate.setDate(1);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        break;
    }

    this.fromDate.set(DateTimeService.toNgbDate(startDate));
    this.toDate.set(DateTimeService.toNgbDate(endDate));
    this.dateChanged.emit({ start: this.fromDate(), end: this.toDate(), dateMode: this.mode() });
  }

  onSetToday() {
    this.fromDate.set(DateTimeService.toNgbDate(DateTimeService.today));

    switch (this.mode()) {
      case 1:
        this.toDate.set(this.fromDate());
        this.dateChanged.emit({ start: this.fromDate(), end: this.toDate(), dateMode: this.mode() });
        break;
      case 2:
        var monday = DateTimeService.toDate(this.fromDate());
        monday.setDate(monday.getDay() == 0 ? monday.getDate() - 6 : monday.getDate() - monday.getDay() + 1);
        var sunday = DateTimeService.toDate(this.fromDate());
        sunday.setDate(sunday.getDay() == 0 ? sunday.getDate() : sunday.getDate() + 7 - sunday.getDay());
        this.dateChanged.emit({ start: DateTimeService.toNgbDate(monday), end: DateTimeService.toNgbDate(sunday), dateMode: this.mode() });
        break;
      case 3:
        this.fromDate.set(this.firstDayOfMonth());
        this.toDate.set(this.lastDayOfMonth());
        this.dateChanged.emit({ start: this.fromDate(), end: this.toDate(), dateMode: this.mode() });
        break;
    }
  }
}
