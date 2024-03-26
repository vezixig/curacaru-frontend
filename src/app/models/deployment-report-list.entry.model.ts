import { ClearanceType } from '@curacaru/enums/clearance-type';
import { UUID } from 'angular2-uuid';

export interface DeploymentReportListEntry {
  isCreated: boolean;
  reportId: UUID;
  clearanceType: ClearanceType;
  customerId: UUID;
  replacementEmployeeId?: UUID;
  month: number;
  year: number;
  customerName: string;
  employeeName: string;
  replacementEmployeeNames: string;
}
