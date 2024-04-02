import { Injectable } from '@angular/core';
import { BaseRepository } from '../../services/repositories/base.repository';
import { UUID } from 'angular2-uuid';
import { InvoiceListEntry } from '@curacaru/dashboard/invoices/models/invoice-list-entry';
import { InvoiceNumber } from '@curacaru/models/invioce-number.model';

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
    return this.client.get<InvoiceListEntry[]>(`${this.apiUrl}/invoices/${year}/${month}`);
  }

  /**
   * Gets the next open invoice number
   * @returns the next invoice number
   */
  getNextInvoiceNumber() {
    return this.client.get<InvoiceNumber>(`${this.apiUrl}/invoices/next-number`);
  }
}
