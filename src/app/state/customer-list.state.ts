import { createAction, createReducer, on, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';

export interface CustomerListState {
  employeeId?: UUID;
}

const initialState: CustomerListState = {
  employeeId: undefined,
};

export const ChangeEmployeeFilterAction = createAction('[CustomerList] Change employee filter', props<{ employeeId?: UUID }>());

export const customerReducer = createReducer(
  initialState,
  on(ChangeEmployeeFilterAction, (state, args) => ({
    ...state,
    employeeId: args.employeeId,
  }))
);
