import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
import { CustomerBudget } from '@curacaru/models/customer-budget.model';
import { CompanyPrices } from '@curacaru/models/company-prices.model';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { Page } from '@curacaru/models/page.model';

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
    return this.httpClient.post(`${this.apiUrl}/appointment/new`, serializedData, this.jsonHeader);
  }

  /** Creates a new customer */
  createCustomer = (customer: Customer) => this.httpClient.post(`${this.apiUrl}/customer/new`, customer);

  /** Creates a new employee */
  createEmployee = (employee: Employee) => this.httpClient.post(`${this.apiUrl}/employee/new`, employee);

  /** Creates a new insurance */
  createInsurance = (insurance: Insurance) => this.httpClient.post(`${this.apiUrl}/insurance/new`, insurance);

  /** Deletes the appointment with the given id */
  deleteAppointment = (id: UUID) => this.httpClient.delete(`${this.apiUrl}/appointment/${id}`);

  /** Delete the customer with the given id */
  deleteCustomer = (id: UUID) => this.httpClient.delete(`${this.apiUrl}/customer/${id}`);

  /** Deletes the insurance with the given id */
  deleteInsurance = (id: UUID) => this.httpClient.delete(`${this.apiUrl}/insurance/${id}`);

  /**
   * Gets the employee with the given ID from the API
   * @param id The id of the employee to delete
   * @returns An observable that completes when the request is done
   */
  deleteEmployee = (id: UUID) => this.httpClient.delete(`${this.apiUrl}/employee/${id}`);

  /** Finishes the appointment with the given id */
  finishAppointment = (id: UUID) => this.httpClient.post(`${this.apiUrl}/appointment/${id}/finish`, {});

  /** Reopens the appointment with the given id */
  reopenAppointment = (id: UUID) => this.httpClient.post(`${this.apiUrl}/appointment/${id}/reopen`, {});

  /** Gets the appointment for the given id */
  getAppointment = (id: UUID) => this.httpClient.get<Appointment>(`${this.apiUrl}/appointment/${id}`);

  /** Gets the list of appointments from the API filtered by the query */
  getAppointmentList(from: NgbDate, to: NgbDate, page: number, onlyOpen: boolean, customer?: number, employee?: number) {
    const options = { params: new HttpParams() };
    options.params = options.params.append('from', DateTimeService.toDateString(from));
    options.params = options.params.append('to', DateTimeService.toDateString(to));
    options.params = options.params.append('page', page);
    if (employee) {
      options.params = options.params.append('employeeId', employee.toString());
    }
    if (customer) {
      options.params = options.params.append('customerId', customer.toString());
    }
    if (onlyOpen) {
      options.params = options.params.append('onlyOpen', 'true');
    }
    return this.httpClient.get<Page<AppointmentListEntry[]>>(`${this.apiUrl}/appointment/list`, options);
  }

  /** Gets the city name for the given zip code */
  getCityName = (zipCode: string) => this.httpClient.get(`${this.apiUrl}/address/city/${zipCode}`, { responseType: 'text' });

  /** Gets the company for the current user */
  getCompany = () => this.httpClient.get<Company>(`${this.apiUrl}/company`);

  /** Gets the company for the current user */
  getCompanyPrices = () => this.httpClient.get<CompanyPrices>(`${this.apiUrl}/company/prices`);

  /** Gets the customer for the given id */
  getCustomer = (id: UUID) => this.httpClient.get<Customer>(`${this.apiUrl}/customer/${id}`);

  /** Gets the list of customers from the API */
  getCustomerList(page: number, employeeId?: UUID) {
    const options = { params: new HttpParams() };
    options.params = options.params.append('page', page);
    if (employeeId) {
      options.params = options.params.append('employeeId', employeeId.toString());
    }
    return this.httpClient.get<Page<CustomerListEntry>>(`${this.apiUrl}/customer/list`, options);
  }

  /** Gets a deployment report */
  getDeploymentReport = (customerId: UUID, insuranceStatus: InsuranceStatus) =>
    this.httpClient.get(`${this.apiUrl}/document/deployment/${customerId}/${insuranceStatus}`, { responseType: 'blob' });

  /** Gets the list of customers with only minimal info */
  getMinimalCustomerList(insuranceStatus?: InsuranceStatus, assignmentDeclarationYear?: number) {
    const options = { params: new HttpParams() };
    if (insuranceStatus != undefined) {
      options.params = options.params.append('insuranceStatus', insuranceStatus);
    }
    if (assignmentDeclarationYear != undefined) {
      options.params = options.params.append('assignmentDeclarationYear', assignmentDeclarationYear.toString());
    }
    return this.httpClient.get<MinimalCustomerListEntry[]>(`${this.apiUrl}/customer/list/minimal`, options);
  }

  getMinimalCustomerListDeploymentReports() {
    return this.httpClient.get<MinimalCustomerListEntry[]>(`${this.apiUrl}/customer/list/minimal-deployment-reports`);
  }

  /** Gets the list of customers with only minimal info */
  getCustomerWithBudget = (customerId: UUID) => this.httpClient.get<CustomerBudget>(`${this.apiUrl}/customer/${customerId}/budget`);

  /** Gets the employee for the given id */
  getEmployee = (id: UUID) => this.httpClient.get<Employee>(`${this.apiUrl}/employee/${id}`);

  /** Gets the list of employees from the API. */
  getEmployeeList = (page: number) => this.httpClient.get<Page<Employee>>(`${this.apiUrl}/employee/list`, { params: { page } });

  /**
   * Gets the list of employees wit only basic information from the API
   * @returns A list of employees
   */
  getEmployeeBaseList = () => this.httpClient.get<EmployeeBasic[]>(`${this.apiUrl}/employee/baselist`);

  /** Gets the insurance for the given id */
  getInsurance = (id: UUID) => this.httpClient.get<Insurance>(`${this.apiUrl}/insurance/${id}`);

  /** Gets insurances matching the search string */
  getInsuranceByName = (term: string) => this.httpClient.get<Insurance[]>(`${this.apiUrl}/insurance?search=${term}`);

  /** Gets all insurances */
  getInsuranceList = (page: number) => this.httpClient.get<Page<Insurance>>(`${this.apiUrl}/insurance/list`, { params: { page } });

  /** Gets the employee of the current user */
  getUser = () => this.httpClient.get<UserEmployee>(`${this.apiUrl}/employee`);

  /** Updates the appointment */
  updateAppointment(appointment: Appointment) {
    const serializedData = JSON.stringify(appointment, this.customSerializer);
    return this.httpClient.put(`${this.apiUrl}/appointment`, serializedData, this.jsonHeader);
  }

  /** Updates the company */
  updateCompany = (company: Company) => this.httpClient.put(`${this.apiUrl}/company`, company);

  /** Updates the customer */
  updateCustomer = (customer: Customer) => this.httpClient.put(`${this.apiUrl}/customer`, customer);

  /** Updates the employee */
  updateEmployee = (employee: Employee) => this.httpClient.put<Employee>(`${this.apiUrl}/employee`, employee);

  /** Updates the insurance */
  updateInsurance = (insurance: Insurance) => this.httpClient.put<Insurance>(`${this.apiUrl}/insurance`, insurance);

  /** SignUp for a new user with company */
  signup = (data: any) => this.httpClient.post(`${this.apiUrl}/signup`, data);
}
