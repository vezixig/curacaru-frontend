import { BaseRepository } from './base.repository';
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AssignmentDeclarationListEntry } from '@curacaru/models/assignment-declaration-list-entry.model';
import { AssignmentDeclaration } from '@curacaru/models/assignment-declaration.mode';
import { UUID } from 'angular2-uuid';

/**
 * Repository for document related requests
 */
@Injectable({
  providedIn: 'root',
})
export class DocumentRepository extends BaseRepository {
  /**
   * Gets the list of assignment declarations
   * @param year the year to get the list for
   * @param customerId an optional customer id to filter by
   * @param employeeId an optional employee id to filter by
   * @returns a list of assignment declarations
   */
  getAssignmentDeclarationList(year: number, customerId?: UUID, employeeId?: UUID) {
    const options = { params: new HttpParams().set('year', year) };
    if (customerId) {
      options.params = options.params.set('customerId', customerId.toString());
    }
    if (employeeId) {
      options.params = options.params.set('employeeId', employeeId.toString());
    }
    return this.client.get<AssignmentDeclarationListEntry[]>(`${this.apiUrl}/documents/assignment-declarations/${year}`, options);
  }

  /**
   * Creates a new, signed assignment declaration
   * @param document the signed assignment declaration
   * @returns an empty observable
   */
  createAssignmentDeclaration(document: AssignmentDeclaration) {
    return this.client.post(`${this.apiUrl}/documents/assignment-declarations`, document);
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
