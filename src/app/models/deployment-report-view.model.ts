import { UUID } from 'angular2-uuid';
import { DeploymentReportTime } from './deployment-report-time.model';

export interface DeploymentReport {
  employeeName: string;
  hasInvoice: boolean;
  hasUnfinishedAppointment: boolean;
  hasPlannedAppointment: boolean;
  isCreated: boolean;
  replacementEmployeeNames: string;
  reportId: UUID;
  times: DeploymentReportTime[];
  totalDuration: number;
}
