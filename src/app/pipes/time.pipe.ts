import { Time } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat',
  standalone: true,
})
export class TimeFormatPipe implements PipeTransform {
  transform(time: Time): string {
    if (!time) return '';
    return time.toString().substring(0, 5);
  }
}
