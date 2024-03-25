import { Time } from '@angular/common';

export interface DeploymentReportTime {
  date: Date;
  start: Time;
  end: Time;
  duration: number;
}
