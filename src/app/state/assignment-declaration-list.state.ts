import { createAction, createReducer, on, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';

export interface AssignmentDeclarationListState {
  year: number;
  customerId?: UUID;
  employeeId?: UUID;
}

export const initialState: AssignmentDeclarationListState = {
  year: new Date().getFullYear(),
  customerId: undefined,
  employeeId: undefined,
};

export const AssignmentDeclarationListChangeFilterAction = createAction(
  '[Assignment Declaration List] Change filter',
  props<{ year: number; customerId?: UUID; employeeId?: UUID }>()
);

export const assignmentDeclarationListReducer = createReducer(
  initialState,
  on(AssignmentDeclarationListChangeFilterAction, (state, args) => ({
    ...state,
    year: args.year,
    customerId: args.customerId,
    employeeId: args.employeeId,
  }))
);
