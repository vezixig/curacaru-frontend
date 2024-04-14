import { AppointmentBase } from './appointment-base.model';

export interface WorkingHours extends AppointmentBase {
  workDuration: number;
  isDone: boolean;
  isPlanned: boolean;
}
