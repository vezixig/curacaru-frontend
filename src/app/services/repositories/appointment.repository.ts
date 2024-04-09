import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { UUID } from 'angular2-uuid';
import { Time } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { DateTimeService } from '../date-time.service';

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

  getIsBlockingAppointment(employeeId: UUID, date: Date, start: Time, end: Time, appointmentId?: UUID) {
    var params = new HttpParams();
    params = params.set('employeeId', employeeId.toString());
    params = params.set('date', DateTimeService.toStringFromDate(date));
    params = params.set('start', DateTimeService.toTimeString(start));
    params = params.set('end', DateTimeService.toTimeString(end));
    if (appointmentId) {
      params = params.set('appointmentId', appointmentId.toString());
    }

    return this.client.get<boolean>(`${this.apiUrl}/appointments/is-blocking`, { params: params });
  }
}
