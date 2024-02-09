import { Time } from '@angular/common';
import { UUID } from 'angular2-uuid';

export interface AppointmentListEntry {
  /** The city the appointment is taking place. */
  city: string;

  /** The name of the customer. */
  customerName: string;

  /** The date of the appointment. */
  date: Date;

  /** The name of the employee. */
  employeeName: string;

  /** The name of the employee replacement. */
  employeeReplacementName?: string;

  /** The id of the appointment. */
  id: UUID;

  /** A value indicating whether the appointment is done. */
  isDone: boolean;

  /** The street the appointment is taking place. */
  street: string;

  /** The end time of the appointment. */
  timeEnd: Time;

  /** The start time of the appointment. */
  timeStart: Time;

  /** The zip code of the city. */
  zipCode: string;

  /** The phone number of the customer. */
  phone: string;
}
