import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { UUID } from 'angular2-uuid';

/**
 * Repository for appointment related requests
 */
@Injectable({
  providedIn: 'root',
})
export class AppointmentRepository extends BaseRepository {
  /**
   * Add the employee signature to an appointment
   * @param appointmentId the appointment id
   * @param signature the signature as image string
   * @returns an empty observable
   */
  addEmployeeSignature(appointmentId: UUID, signature: string) {
    return this.client.post(`${this.apiUrl}/appointment/${appointmentId}/signature/employee`, { signature: signature });
  }

  /**
   * Add the customer signature to an appointment
   * @param appointmentId the appointment id
   * @param signature the signature as image string
   * @returns an empty observable
   */
  addCustomerSignature(appointmentId: UUID, signature: string) {
    return this.client.post(`${this.apiUrl}/appointment/${appointmentId}/signature/customer`, { signature: signature });
  }
}
