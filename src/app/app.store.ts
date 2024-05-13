import { Action, ActionReducer } from '@ngrx/store';
import { CustomerListState, customerReducer as customerListReducer } from './state/customer-list.state';
import { AppointmentListState, appointmentListReducer } from './state/appointment-list.state';
import { TimeTrackerState, timeTrackerReducer } from './state/time-tracker.state';
import { DeploymentReportListState, deploymentReportListReducer } from './state/deployment-report-list.state';
import { AssignmentDeclarationListState, assignmentDeclarationListReducer } from './state/assignment-declaration-list.state';
import { InvoicesListState, invoicesListReducer } from './state/invoices-list.state';
import { EmployeeListState, employeeListReducer } from './state/employee-list.state';
import { BudgetsListState, budgetsListReducer } from './state/budgets-list.state';

export interface AppStore {
  appointmentList: ActionReducer<AppointmentListState, Action>;
  assignmentDeclarationList: ActionReducer<AssignmentDeclarationListState, Action>;
  budgetsList: ActionReducer<BudgetsListState, Action>;
  deploymentReportList: ActionReducer<DeploymentReportListState, Action>;
  employeeList: ActionReducer<EmployeeListState, Action>;
  customerList: ActionReducer<CustomerListState, Action>;
  invoicesList: ActionReducer<InvoicesListState, Action>;
  timeTracker: ActionReducer<TimeTrackerState, Action>;
}

export const appStore: AppStore = {
  appointmentList: appointmentListReducer,
  assignmentDeclarationList: assignmentDeclarationListReducer,
  budgetsList: budgetsListReducer,
  customerList: customerListReducer,
  deploymentReportList: deploymentReportListReducer,
  employeeList: employeeListReducer,
  invoicesList: invoicesListReducer,
  timeTracker: timeTrackerReducer,
};
