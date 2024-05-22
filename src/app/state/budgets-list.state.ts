import { createAction, createReducer, on, props } from '@ngrx/store';

export interface BudgetsListState {
  page: number;
}

const initialState: BudgetsListState = {
  page: 1,
};

export const ChangePageAction = createAction('[BudgetsListState] Change page', props<{ page: number }>());

export const budgetsListReducer = createReducer(
  initialState,
  on(ChangePageAction, (state, args) => ({
    ...state,
    page: args.page,
  }))
);
