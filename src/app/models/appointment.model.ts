import { Time } from '@angular/common';
import { ClearanceType } from '@curacaru/enums/clearance-type';
import { UUID } from 'angular2-uuid';

export interface Appointment {
  clearanceType: ClearanceType;
  customerId: UUID;
  date: Date;
  distanceToCustomer?: number;
  employeeId: UUID;
  employeeReplacementId?: UUID;
  id?: UUID;
  isDone: boolean;
  isSignedByCustomer: boolean;
  isSignedByEmployee: boolean;
  notes: string;
  timeEnd: Time;
  timeStart: Time;
  costs: number;
  costsLastYearBudget: number;
}
