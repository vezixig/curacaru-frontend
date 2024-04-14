import { BaseRepository } from './base.repository';
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ClearanceType } from '@curacaru/enums/clearance-type';
import { AssignmentDeclarationListEntry } from '@curacaru/models/assignment-declaration-list-entry.model';
import { AssignmentDeclaration } from '@curacaru/models/assignment-declaration.mode';
import { DeploymentReportListEntry } from '@curacaru/models/deployment-report-list.entry.model';
import { DeploymentReport } from '@curacaru/models/deployment-report-view.model';
import { UUID } from 'angular2-uuid';
import { DateTimeService } from '../date-time.service';
import { map } from 'rxjs';
import { DeploymentReportSaveModel } from '@curacaru/models/deployment-report-save.model';

/**
 * Repository for document related requests
 */
@Injectable({
  providedIn: 'root',
})
export class DocumentRepository extends BaseRepository {
  getDeploymentReportDocument(year: number, month: number, customerId: UUID, clearanceType: ClearanceType) {
    return this.client.get(`${this.apiUrl}/documents/deployment-reports/${year}/${month}/${customerId}/${clearanceType}/document`, {
      responseType: 'blob',
    });
  }

  saveDeploymentReport(report: DeploymentReportSaveModel) {
    report.clearanceType = +report.clearanceType;
    return this.client.post(`${this.apiUrl}/documents/deployment-reports`, report);
  }

  getDeploymentReportsList(year: number, month: number, customerId?: UUID, employeeId?: UUID) {
    const options = { params: new HttpParams().set('year', year) };
    if (customerId) {
      options.params = options.params.set('customerId', customerId.toString());
    }
    if (employeeId) {
      options.params = options.params.set('employeeId', employeeId.toString());
    }

    return this.client.get<DeploymentReportListEntry[]>(`${this.apiUrl}/documents/deployment-reports/${year}/${month}`, options);
  }

  getDeploymentReport(year: number, month: number, customerId: UUID, clearanceType: ClearanceType) {
    return this.client.get<DeploymentReport>(`${this.apiUrl}/documents/deployment-reports/${year}/${month}/${customerId}/${clearanceType}`).pipe(
      map((report) => {
        report?.times.map((time) => {
          time.start = DateTimeService.toTime(time.start.toString());
          time.end = DateTimeService.toTime(time.end.toString());
          return time;
        });
        return report;
      })
    );
  }

  /**
   * Creates a new, signed assignment declaration
   * @param document the signed assignment declaration
   * @returns an empty observable
   */
  createAssignmentDeclaration(document: AssignmentDeclaration) {
    return this.client.post(`${this.apiUrl}/documents/assignment-declarations`, document);
  }

  /**
   * Deletes an assignment declaration
   * @param id the id of the assignment declaration to delete
   * @returns an empty observable
   */
  deleteAssignmentDeclaration(id: UUID) {
    return this.client.delete(`${this.apiUrl}/documents/assignment-declarations/${id}`);
  }

  /**
   * Deletes a deployment report
   * @param id the id of the report
   * @returns an empty observable
   */
  deleteDeploymentReport(id: UUID) {
    return this.client.delete(`${this.apiUrl}/documents/deployment-reports/${id}`);
  }

  /**
   * Gets the list of assignment declarations
   * @param year the year to get the list for
   * @param employeeId an optional employee id to filter by
   * @returns a list of assignment declarations
   */
  getAssignmentDeclarationList(year: number, employeeId?: UUID) {
    const options = { params: new HttpParams().set('year', year) };
    if (employeeId) {
      options.params = options.params.set('employeeId', employeeId.toString());
    }
    return this.client.get<AssignmentDeclarationListEntry[]>(`${this.apiUrl}/documents/assignment-declarations/${year}`, options);
  }

  /** Gets an assignment declaration document
   * @param customerId the customer id to get the document for
   * @param year the year to get the document for
   * @returns the assignment declaration document
   */
  getAssignmentDeclaration(customerId: UUID, year: number) {
    return this.client.get(`${this.apiUrl}/documents/assignment-declarations/${year}/${customerId}`, { responseType: 'blob' });
  }
}
