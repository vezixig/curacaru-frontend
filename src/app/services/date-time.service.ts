import { Time } from '@angular/common';
import { Injectable } from '@angular/core';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { NgbTime } from '../models/ngbtime';

@Injectable({
  providedIn: 'root',
})
export class DateTimeService {
  static toNgbTime(timeStart: Time | string): NgbTime {
    if (typeof timeStart === 'string') {
      const timeParts = timeStart.split(':');
      return new NgbTime(parseInt(timeParts[0]), parseInt(timeParts[1]));
    }
    return new NgbTime(timeStart.hours, timeStart.minutes);
  }

  static toNgbDate(date: Date | string): NgbDate {
    if (typeof date === 'string') {
      const dateParts = date.split('-');
      return new NgbDate(parseInt(dateParts[0]), parseInt(dateParts[1]), parseInt(dateParts[2]));
    }
    return new NgbDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  static toDateString(date: NgbDate | null): string {
    return date ? `${date.year}-${date.month}-${date.day}` : '';
  }

  static toDate(date: NgbDate | null): Date {
    return date ? new Date(date.year, date.month, date.day) : new Date();
  }

  static toTime(value: NgbTime): Time {
    return { hours: value.hour, minutes: value.minute };
  }

  static toTimeString(time: Time) {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}:00`;
  }

  /**
   * Gets the dates for Monday and Sunday of week the given date is in.
   * @param date The date to get the start and end of the week from.
   * @returns The start and end date of the week of the given date.
   */
  static getStartAndEndOfWeek(date: Date) {
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? 0 : 7));

    return {
      start: new NgbDate(startOfWeek.getFullYear(), startOfWeek.getMonth() + 1, startOfWeek.getDate()),
      end: new NgbDate(endOfWeek.getFullYear(), endOfWeek.getMonth() + 1, endOfWeek.getDate()),
    };
  }
}
