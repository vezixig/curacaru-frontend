import { type Time } from '@angular/common';
import { UUID } from 'angular2-uuid';

export interface DeploymentReportTime {
  date: string;
  start: Time;
  end: Time;
  appointmentId: UUID;
  duration: number;
  distance: number;
  isDone: boolean;
  isPlanned: boolean;
}
