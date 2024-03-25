import { ClearanceType } from '@curacaru/enums/clearance-type';
import { UUID } from 'angular2-uuid';

export interface DeploymentReportSaveModel {
  clearanceType: ClearanceType;
  customerId: UUID;
  month: number;
  signatureCity: string;
  signatureCustomer: string;
  signatureEmployee: string;
  year: number;
}
