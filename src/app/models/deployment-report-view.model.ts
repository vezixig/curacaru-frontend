import { DeploymentReportTime } from './deployment-report-time.model';

export interface DeploymentReport {
  employeeName: string;
  isCreated: boolean;
  hasUnfinishedAppointment: boolean;
  replacementEmployeeNames: string;
  times: DeploymentReportTime[];
  totalDuration: number;
}
