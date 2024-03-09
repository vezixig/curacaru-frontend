import { Time } from '@angular/common';
import { Injectable } from '@angular/core';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { NgbTime } from '../models/ngbtime';

@Injectable({
  providedIn: 'root',
})
export class DateTimeService {
  private static dateFormat = new Intl.DateTimeFormat('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });

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
    return date ? `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}` : '';
  }

  static toDate(date: NgbDate | null): Date {
    return date ? new Date(date.year, date.month - 1, date.day, 12) : new Date();
  }

  static toTime(value: NgbTime | string): Time {
    if (typeof value === 'string') {
      const timeParts = value.split(':');
      return { hours: parseInt(timeParts[0]), minutes: parseInt(timeParts[1]) };
    }
    return { hours: value.hour, minutes: value.minute };
  }

  static toTimeString(time: Time, includeSeconds = true) {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}` + (includeSeconds ? ':00' : '');
  }

  static toLocalDateString(date: Date) {
    return this.dateFormat.format(date);
  }

  static beginOfCurrentMonth: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  static months = [
    { name: 'Januar', value: 1 },
    { name: 'Februar', value: 2 },
    { name: 'März', value: 3 },
    { name: 'April', value: 4 },
    { name: 'Mai', value: 5 },
    { name: 'Juni', value: 6 },
    { name: 'Juli', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'Oktober', value: 10 },
    { name: 'November', value: 11 },
    { name: 'Dezember', value: 12 },
  ];

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
