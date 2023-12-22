import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { first } from 'rxjs';
import { Employee } from '../models/employee.model';
import { UUID } from 'angular2-uuid';
import { environment } from '../../environments/environment';
import { Customer } from '../models/customer.model';
import { CustomerListEntry } from '../models/customer-list-entry.model';
import { AppointmentListEntry } from '../models/appointment-list-entry.model';
import { EmployeeBasic } from '../models/employee-basic.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.auth0.api.serverUrl;

  constructor(private _httpClient: HttpClient) {}

  /** Gets the list of employees from the API. */
  getEmployeeList = () => this._httpClient.get<Employee[]>(`${this.apiUrl}/employee/list`).pipe(first());

  /** Gets the list of employees wit only basic information from the API. */
  getEmployeeBaseList = () => this._httpClient.get<EmployeeBasic[]>(`${this.apiUrl}/employee/baselist`).pipe(first());

  /** Gets the employee with the given ID from the API. */
  deleteEmployee = (id: UUID) => this._httpClient.delete(`${this.apiUrl}/employee/${id}`).pipe(first());

  /** Gets the list of customers from the API. */
  getCustomerList = () => this._httpClient.get<CustomerListEntry[]>(`${this.apiUrl}/customer/list`).pipe(first());

  /** Delete the customer with the given id. */
  deleteCustomer = (id: UUID) => this._httpClient.delete(`${this.apiUrl}/customer/${id}`).pipe(first());

  /** Gets the list of appointments from the API filtered by the query. */
  getAppointmentList = (query: string) => this._httpClient.get<AppointmentListEntry[]>(`${this.apiUrl}/appointment/list${query}`).pipe(first());

  /** Deletes the appointment with the given id. */
  deleteAppointment = (id: UUID) => this._httpClient.delete(`${this.apiUrl}/appointment/${id}`).pipe(first());
}
