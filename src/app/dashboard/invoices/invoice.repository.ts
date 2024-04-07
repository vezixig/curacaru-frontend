import { Injectable } from '@angular/core';
import { BaseRepository } from '../../services/repositories/base.repository';
import { UUID } from 'angular2-uuid';
import { InvoiceListEntry } from '@curacaru/dashboard/invoices/models/invoice-list-entry.model';
import { InvoiceNumber } from '@curacaru/models/invioce-number.model';
import { InvoiceAddModel } from '@curacaru/dashboard/invoices/models/invoice-add.model';

/**
 * Repository for appointment related requests
 */
@Injectable({
  providedIn: 'root',
})
export class InvoiceRepository extends BaseRepository {
  /**
   * Gets the invoice list for the given parameters
   * @param year the year
   * @param month the month
   * @param customerId an optional customer id to filter the list
   * @returns an invoice list
   */
  getInvoiceList(year: number, month: number, customerId?: UUID) {
    if (customerId) {
      return this.client.get<InvoiceListEntry[]>(`${this.apiUrl}/invoices/${year}/${month}/${customerId}`);
    }
    return this.client.get<InvoiceListEntry[]>(`${this.apiUrl}/invoices/${year}/${month}`);
  }

  /**
   * Gets the next open invoice number
   * @returns the next invoice number
   */
  getNextInvoiceNumber() {
    return this.client.get<InvoiceNumber>(`${this.apiUrl}/invoices/next-number`);
  }

  /**
   * Adds a new invoice based on a deployment report
   * @param invoice the invoice to add
   * @returns an empty observable
   */
  addInvoice(invoice: InvoiceAddModel) {
    return this.client.post(`${this.apiUrl}/invoices`, invoice);
  }

  /**
   * Gets the invoice document for the given invoice id
   * @param invoiceId the invoice id
   * @returns the document as blob
   */
  getInvoiceDocument(invoiceId: UUID) {
    return this.client.get(`${this.apiUrl}/invoices/${invoiceId}/document`, {
      responseType: 'blob',
    });
  }

  /**
   * Deletes the invoice with the given id
   * @param invoiceId the invoice id
   * @returns an empty observable
   */
  deleteInvoice(invoiceId: UUID) {
    return this.client.delete(`${this.apiUrl}/invoices/${invoiceId}`);
  }
}
