import { createAction, createReducer, on, props } from '@ngrx/store';

export interface EmployeeListState {
  page: number;
}

const initialState: EmployeeListState = {
  page: 1,
};

export const ChangePageAction = createAction('[EmployeeList] Change page', props<{ page: number }>());

export const employeeListReducer = createReducer(
  initialState,
  on(ChangePageAction, (state, args) => ({
    ...state,
    page: args.page,
  }))
);
