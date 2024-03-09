import { WorkingHoursReportStatus } from '@curacaru/enums/working-hours-report-status';
import { UUID } from 'angular2-uuid';

export interface WorkingHoursReportListEntry {
  employeeId: UUID;
  employeeName: string;
  id: UUID;
  month: number;
  status: WorkingHoursReportStatus;
  workedHours: number;
  year: number;
}
