import { UUID } from 'angular2-uuid';

export interface InvoiceAddModel {
  deploymentReportId: UUID;
  invoiceDate: string;
  invoiceNumber: string;
  signature: string;
}
