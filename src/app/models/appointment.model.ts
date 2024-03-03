import { Time } from '@angular/common';
import { ClearanceType } from '@curacaru/enums/clearance-type';
import { UUID } from 'angular2-uuid';

export interface Appointment {
  clearanceType: ClearanceType;
  costs: number;
  costsLastYearBudget: number;
  customerId: UUID;
  date: Date;
  distanceToCustomer?: number;
  employeeId: UUID;
  employeeReplacementId?: UUID;
  hasBudgetError: boolean;
  id?: UUID;
  isDone: boolean;
  isPlanned: boolean;
  isSignedByCustomer: boolean;
  isSignedByEmployee: boolean;
  notes: string;
  timeEnd: Time;
  timeStart: Time;
}
