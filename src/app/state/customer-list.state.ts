import { createAction, createReducer, on, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';

export interface CustomerListState {
  employeeId?: UUID;
  showInactiveCustomers: boolean;
  page: number;
}

const initialState: CustomerListState = {
  employeeId: undefined,
  showInactiveCustomers: false,
  page: 1,
};

export const ChangeEmployeeFilterAction = createAction(
  '[CustomerList] Change employee filter',
  props<{ employeeId?: UUID; showInactiveCustomers: boolean }>()
);
export const ChangePageAction = createAction('[CustomerList] Change page', props<{ page: number }>());

export const customerReducer = createReducer(
  initialState,
  on(ChangeEmployeeFilterAction, (state, args) => ({
    ...state,
    page: 1,
    employeeId: args.employeeId,
    showInactiveCustomers: args.showInactiveCustomers,
  })),
  on(ChangePageAction, (state, args) => ({
    ...state,
    page: args.page,
  }))
);
