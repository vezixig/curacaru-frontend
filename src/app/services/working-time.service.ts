import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { WorkingHours } from '@curacaru/models/working-hours.model';
import { UUID } from 'angular2-uuid';
import { environment } from '../../environments/environment';
import { WorkingTimeReportSignature } from '@curacaru/models/working-hours-report';
import { DateTimeService } from './date-time.service';
import { WorkingHoursReportListEntry } from '@curacaru/models/working-time-list-entry.model';

@Injectable({
  providedIn: 'root',
})
export class WorkingTimeService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiUrl = environment.auth0.api.serverUrl;
  private readonly jsonHeader = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };

  private customSerializer = (_: string, value: any) => {
    if (value === null) return value;

    // ngDate
    if (typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
      return DateTimeService.toDateString(value);
    }

    return value;
  };

  /**
   * Gets the working time for a specific employee in a month
   * @param employeeId the id of the employee
   * @param month the month
   * @param year the year
   * @returns an observable of the working time in the given month
   */
  getWorkTime(employeeId: UUID, month: number, year: number) {
    return this.httpClient.get<WorkingHours[]>(`${this.apiUrl}/work-time/employee/${employeeId}?year=${year}&month=${month}`);
  }

  getWorkTimeList(year: number, month: number) {
    return this.httpClient.get<WorkingHoursReportListEntry[]>(`${this.apiUrl}/work-time/list?month=${year}&year=${month}`);
  }

  getWorkTimeReport(employeeId: UUID, year: number, month: number) {
    return this.httpClient.get(`${this.apiUrl}/work-time/employee/${employeeId}/report?year=${year}&month=${month}`);
  }

  /** Creates a new signed working time report */
  signWorkingTimeReport(report: WorkingTimeReportSignature) {
    const serializedData = JSON.stringify(report, this.customSerializer);
    return this.httpClient.post(`${this.apiUrl}/work-time/sign`, serializedData, this.jsonHeader);
  }
}
