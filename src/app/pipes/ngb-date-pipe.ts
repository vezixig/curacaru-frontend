import { Pipe, PipeTransform } from '@angular/core';
import { DateTimeService } from '@curacaru/services';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';

@Pipe({
  name: 'ngbDate',
  standalone: true,
})
export class NgbDatePipe implements PipeTransform {
  transform(value: NgbDate, showWeekday: boolean = false): string {
    if (showWeekday) {
      return DateTimeService.toDate(value).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
    }
    return DateTimeService.toDate(value).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
}
