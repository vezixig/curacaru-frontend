import { Time } from '@angular/common';
import { UUID } from 'angular2-uuid';

export interface Appointment {
  customerId: UUID;
  date: Date;
  employeeId: UUID;
  employeeReplacementId?: UUID;
  id?: UUID;
  isDone: boolean;
  isSignedByCustomer: boolean;
  isSignedByEmployee: boolean;
  notes: string;
  timeEnd: Time;
  timeStart: Time;
  distanceToCustomer?: number;
}
