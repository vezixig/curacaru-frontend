import { Time } from '@angular/common';
import { UUID } from 'angular2-uuid';

export interface AppointmentListEntry {
  /** Indicates whether the day of the appointment is the customer's birthday. */
  isBirthday: boolean;

  /** The city the appointment is taking place. */
  city: string;

  /** The name of the customer. */
  customerName: string;

  /** The date of the appointment. */
  date: Date;

  /** A value indicating whether the customer can sign. */
  canSign: boolean;

  /** The name of the employee. */
  employeeName: string;

  /** The id of the employee. */
  employeeId: UUID;

  /** The name of the employee replacement. */
  employeeReplacementName?: string;

  /** The id of the employee replacement. */
  employeeReplacementId?: UUID;

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

  /** A value indicating if the planned appointment couldn't be processed. */
  hasBudgetError: boolean;

  /** A value indicating whether the appointment is planned for the future. */
  isPlanned: boolean;

  /** A value indicating whether the appointment is signed by the employee. */
  isSignedByEmployee: boolean;

  /** A value indicating whether the appointment is signed by the customer. */
  isSignedByCustomer: boolean;
}
