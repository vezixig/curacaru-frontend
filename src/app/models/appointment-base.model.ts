import { Time } from '@angular/common';
import { UUID } from 'angular2-uuid';

export interface AppointmentBase {
  /** The date of the appointment. */
  date: Date;

  /** The end time of the appointment. */
  timeEnd: Time;

  /** The start time of the appointment. */
  timeStart: Time;

  /** The id of the appointment */
  appointmentId: UUID;
}
