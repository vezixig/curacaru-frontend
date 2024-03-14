import { Time } from '@angular/common';

export interface WorkingHours {
  workDuration: number;
  date: Date;
  timeStart: Time;
  timeEnd: Time;
  isDone: boolean;
}
