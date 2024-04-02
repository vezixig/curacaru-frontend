import { ClearanceType } from '@curacaru/enums/clearance-type';
import { UUID } from 'angular2-uuid';

export interface InvoiceListEntry {
  year: number;
  month: number;
  customerName: string;
  customerId: UUID;
  clearanceType: ClearanceType;
  invoiceNumber: string;
}
