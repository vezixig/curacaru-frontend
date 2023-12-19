import { Time } from '@angular/common';
import { UUID } from 'angular2-uuid';

export interface AppointmentListEntry {
  /** Gets or sets the city the appointment is taking place. */
  city: string;

  /** Gets or sets the name of the customer. */
  customerName: string;

  /** Gets or sets the date of the appointment. */
  date: Date;

  /** Gets or sets the name of the employee. */
  employeeName: string;

  /** Gets or sets the name of the employee replacement. */
  employeeReplacementName?: string;

  /** Gets or sets the id of the appointment. */
  id: UUID;

  /** Gets or sets the end time of the appointment. */
  timeEnd: Time;

  /** Gets or sets the start time of the appointment. */
  timeStart: Time;
}
