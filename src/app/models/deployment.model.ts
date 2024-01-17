import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { UUID } from 'angular2-uuid';

export interface Deployment {
  customerId: UUID;
  customerName: string;
  insuranceStatus: InsuranceStatus;
}
