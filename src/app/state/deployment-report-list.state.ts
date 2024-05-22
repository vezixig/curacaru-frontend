import { createAction, createActionGroup, createReducer, on, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';

export interface DeploymentReportListState {
  employeeId?: UUID;
  customerId?: UUID;
  year: number;
  month: number;
  page: number;
}

const initialState: DeploymentReportListState = {
  employeeId: undefined,
  customerId: undefined,
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  page: 1,
};

export const DeploymentReportChangeFilterAction = createAction(
  '[Deployment Report List] Change filter',
  props<{ employeeId?: UUID; customerId?: UUID; year: number; month: number; page: 1 }>()
);

export const DeploymentReportChangeCustomerAction = createAction('[Deployment Report List] Change customer', props<{ customerId?: UUID }>());

export const DeploymentReportChangePageAction = createAction('[Deployment Report List] Change page', props<{ page: number }>());

export const deploymentReportListReducer = createReducer(
  initialState,
  on(DeploymentReportChangeFilterAction, (state, args) => ({
    ...state,
    customerId: args.customerId,
    employeeId: args.employeeId,
    year: args.year,
    month: args.month,
  })),
  on(DeploymentReportChangeCustomerAction, (state, args) => ({
    ...state,
    customerId: args.customerId,
  })),
  on(DeploymentReportChangePageAction, (state, args) => ({
    ...state,
    page: args.page,
  }))
);
