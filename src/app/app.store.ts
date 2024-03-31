import { Action, ActionReducer } from '@ngrx/store';
import { CustomerListState, customerReducer as customerListReducer } from './state/customer-list.state';
import { AppointmentListState, appointmentListReducer } from './state/appointment-list.state';
import { TimeTrackerState, timeTrackerReducer } from './state/time-tracker.state';
import { DeploymentReportListState, deploymentReportListReducer } from './state/deployment-report-list.state';
import { AssignmentDeclarationListState, assignmentDeclarationListReducer } from './state/assignment-declaration-list.state';

export interface AppStore {
  appointmentList: ActionReducer<AppointmentListState, Action>;
  assignmentDeclarationList: ActionReducer<AssignmentDeclarationListState, Action>;
  deploymentReportList: ActionReducer<DeploymentReportListState, Action>;
  customerList: ActionReducer<CustomerListState, Action>;
  timeTracker: ActionReducer<TimeTrackerState, Action>;
}

export const appStore: AppStore = {
  appointmentList: appointmentListReducer,
  assignmentDeclarationList: assignmentDeclarationListReducer,
  customerList: customerListReducer,
  deploymentReportList: deploymentReportListReducer,
  timeTracker: timeTrackerReducer,
};
