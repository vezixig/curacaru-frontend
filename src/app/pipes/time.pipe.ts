import { Time } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { DateTimeService } from '../services/date-time.service';

@Pipe({
  name: 'timeFormat',
  standalone: true,
})
export class TimeFormatPipe implements PipeTransform {
  transform(time: Time): string {
    if (!time) return '';
    return DateTimeService.toTimeString(time, false);
  }
}
