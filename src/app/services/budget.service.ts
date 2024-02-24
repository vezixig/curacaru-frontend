import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BudgetListEntry } from '@curacaru/models/budget-list-entry.model';
import { environment } from '../../environments/environment';
import { Budget } from '@curacaru/models/budget.model';
import { UUID } from 'angular2-uuid';
import { BudgetUpdate } from '@curacaru/models/BudgetUpdate';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  putBudget = (customerId: UUID, budget: BudgetUpdate) => this.httpClient.put(`${this.apiUrl}/budgets/${customerId}`, budget);

  private apiUrl = environment.auth0.api.serverUrl;

  constructor(private httpClient: HttpClient) {}

  /** Gets the list of budgets */
  getBudgetList = () => this.httpClient.get<BudgetListEntry[]>(`${this.apiUrl}/budgets/list`);

  /** Gets the current budget of a customer
   * @param customerId The customer id
   */
  getBudget = (customerId: UUID) => this.httpClient.get<Budget>(`${this.apiUrl}/budgets/${customerId}`);
}
