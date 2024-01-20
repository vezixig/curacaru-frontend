import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { UUID } from 'angular2-uuid';

export interface MinimalCustomerListEntry {
  customerId: UUID;
  customerName: string;
  insuranceStatus: InsuranceStatus;
}
