import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { first } from 'rxjs';
import { Employee } from '../models/employee.model';
import { UUID } from 'angular2-uuid';
import { environment } from '../../environments/environment';
import { Customer } from '../models/customer.model';
import { CustomerListEntry } from '../models/customer-list-entry.model';
import { AppointmentListEntry } from '../models/appointment-list-entry.model';
import { EmployeeBasic } from '../models/employee-basic.model';
import { Insurance } from '../models/insurance.model';
import { Appointment } from '../models/appointment.model';
import { DateTimeService } from './date-time.service';
import { UserEmployee } from '../models/user-employee.model';
import { Company } from '../models/company.model';
import { MinimalCustomerListEntry } from '@curacaru/models/minimal-customer-list-entry.model';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.auth0.api.serverUrl;
  private regexDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  private customSerializer = (key: string, value: any) => {
    if (value === null) return value;

    // ngDate
    if (typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
      return DateTimeService.toDateString(value);
    }
    // time
    if (typeof value === 'object' && 'hours' in value && 'minutes' in value) {
      return DateTimeService.toTimeString(value);
    }
    // date
    if (this.regexDate.test(value) && key === 'date') {
      return value.substr(0, 10);
    }
    return value;
  };
  private jsonHeader = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };

  constructor(private httpClient: HttpClient) {}

  /** Creates a new appointment */
  createAppointment(appointment: Appointment) {
    const serializedData = JSON.stringify(appointment, this.customSerializer);
    return this.httpClient.post(`${this.apiUrl}/appointment/new`, serializedData, this.jsonHeader).pipe(first());
  }

  /** Creates a new customer */
  createCustomer = (customer: Customer) => this.httpClient.post(`${this.apiUrl}/customer/new`, customer).pipe(first());

  /** Creates a new employee */
  createEmployee = (employee: Employee) => this.httpClient.post(`${this.apiUrl}/employee/new`, employee).pipe(first());

  /** Creates a new insurance */
  createInsurance = (insurance: Insurance) => this.httpClient.post(`${this.apiUrl}/insurance/new`, insurance).pipe(first());

  /** Deletes the appointment with the given id */
  deleteAppointment = (id: UUID) => this.httpClient.delete(`${this.apiUrl}/appointment/${id}`).pipe(first());

  /** Delete the customer with the given id */
  deleteCustomer = (id: UUID) => this.httpClient.delete(`${this.apiUrl}/customer/${id}`).pipe(first());

  /** Deletes the insurance with the given id */
  deleteInsurance = (id: UUID) => this.httpClient.delete(`${this.apiUrl}/insurance/${id}`).pipe(first());

  /**
   * Gets the employee with the given ID from the API
   * @param id The id of the employee to delete
   * @returns An observable that completes when the request is done
   */
  deleteEmployee = (id: UUID) => this.httpClient.delete(`${this.apiUrl}/employee/${id}`).pipe(first());

  /** Finishes the appointment with the given id */
  finishAppointment = (id: UUID) => this.httpClient.post(`${this.apiUrl}/appointment/${id}/finish`, {}).pipe(first());

  /** Gets the appointment for the given id */
  getAppointment = (id: UUID) => this.httpClient.get<Appointment>(`${this.apiUrl}/appointment/${id}`).pipe(first());

  /** Gets the list of appointments from the API filtered by the query */
  getAppointmentList = (query: string) => this.httpClient.get<AppointmentListEntry[]>(`${this.apiUrl}/appointment/list${query}`).pipe(first());

  /** Gets the city name for the given zip code */
  getCityName = (zipCode: string) => this.httpClient.get(`${this.apiUrl}/address/city/${zipCode}`, { responseType: 'text' }).pipe(first());

  /** Gets the company for the current user */
  getCompany = () => this.httpClient.get<Company>(`${this.apiUrl}/company`).pipe(first());

  /** Gets the customer for the given id */
  getCustomer = (id: UUID) => this.httpClient.get<Customer>(`${this.apiUrl}/customer/${id}`).pipe(first());

  /** Gets the list of customers from the API */
  getCustomerList = () => this.httpClient.get<CustomerListEntry[]>(`${this.apiUrl}/customer/list`).pipe(first());

  /** Gets a deployment report */
  getDeploymentReport = (customerId: UUID, insuranceStatus: InsuranceStatus) => this.httpClient.get(`${this.apiUrl}/document/deployment/${customerId}/${insuranceStatus}`, { responseType: 'blob' }).pipe(first());

  /** Gets an assignment declaration document */
  getAssignmentDeclaration = (customerId: UUID, year: number) => this.httpClient.get(`${this.apiUrl}/document/assignment-declaration/${customerId}/${year}`, { responseType: 'blob' }).pipe(first());

  /** Gets the list of customers with only minimal info */
  getMinimalCustomerList = () => this.httpClient.get<MinimalCustomerListEntry[]>(`${this.apiUrl}/customer/list/minimal`).pipe(first());

  /** Gets the employee for the given id */
  getEmployee = (id: UUID) => this.httpClient.get<Employee>(`${this.apiUrl}/employee/${id}`).pipe(first());

  /** Gets the list of employees from the API. */
  getEmployeeList = () => this.httpClient.get<Employee[]>(`${this.apiUrl}/employee/list`).pipe(first());

  /**
   * Gets the list of employees wit only basic information from the API
   * @returns A list of employees
   */
  getEmployeeBaseList = () => this.httpClient.get<EmployeeBasic[]>(`${this.apiUrl}/employee/baselist`).pipe(first());

  /** Gets the insurance for the given id */
  getInsurance = (id: UUID) => this.httpClient.get<Insurance>(`${this.apiUrl}/insurance/${id}`);

  /** Gets insurances matching the search string */
  getInsuranceByName = (term: string) => this.httpClient.get<Insurance[]>(`${this.apiUrl}/insurance?search=${term}`);

  /** Gets all insurances */
  getInsuranceList = () => this.httpClient.get<Insurance[]>(`${this.apiUrl}/insurance/list`);

  /** Gets the employee of the current user */
  getUser = () => this.httpClient.get<UserEmployee>(`${this.apiUrl}/employee`).pipe(first());

  /** Updates the appointment */
  updateAppointment(appointment: Appointment) {
    const serializedData = JSON.stringify(appointment, this.customSerializer);
    return this.httpClient.put(`${this.apiUrl}/appointment`, serializedData, this.jsonHeader).pipe(first());
  }

  /** Updates the company */
  updateCompany = (company: Company) => this.httpClient.put(`${this.apiUrl}/company`, company).pipe(first());

  /** Updates the customer */
  updateCustomer = (customer: Customer) => this.httpClient.put(`${this.apiUrl}/customer`, customer).pipe(first());

  /** Updates the employee */
  updateEmployee = (employee: Employee) => this.httpClient.put<Employee>(`${this.apiUrl}/employee`, employee).pipe(first());

  /** Updates the insurance */
  updateInsurance = (insurance: Insurance) => this.httpClient.put<Insurance>(`${this.apiUrl}/insurance`, insurance).pipe(first());

  /** SignUp for a new user with company */
  signup = (data: any) => this.httpClient.post(`${this.apiUrl}/signup`, data).pipe(first());
}
