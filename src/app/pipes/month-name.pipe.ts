import { Pipe, PipeTransform } from '@angular/core';
import { DateTimeService } from '@curacaru/services';

@Pipe({
  name: 'monthName',
  standalone: true,
})
export class MonthNamePipe implements PipeTransform {
  transform(value: number): string {
    return DateTimeService.months[value - 1]?.name ?? 'Unbekannt';
  }
}
