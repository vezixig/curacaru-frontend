import { createAction, createReducer, on, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';

export interface AssignmentDeclarationListState {
  year: number;
  customerId?: UUID;
  employeeId?: UUID;
  page: number;
}

export const initialState: AssignmentDeclarationListState = {
  year: new Date().getFullYear(),
  customerId: undefined,
  employeeId: undefined,
  page: 1,
};

export const AssignmentDeclarationListChangeFilterAction = createAction(
  '[Assignment Declaration List] Change filter',
  props<{ year: number; customerId?: UUID; employeeId?: UUID }>()
);

export const AssignmentDeclarationListChangePageAction = createAction('[Assignment Declaration List] Change page', props<{ page: number }>());

export const assignmentDeclarationListReducer = createReducer(
  initialState,
  on(AssignmentDeclarationListChangeFilterAction, (state, args) => ({
    ...state,
    page: 1,
    year: args.year,
    customerId: args.customerId,
    employeeId: args.employeeId,
  })),
  on(AssignmentDeclarationListChangePageAction, (state, args) => ({
    ...state,
    page: args.page,
  }))
);
