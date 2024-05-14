import { createAction, createReducer, on, props } from '@ngrx/store';

export interface InsurancesListState {
  page: number;
}

const initialState: InsurancesListState = {
  page: 1,
};

export const ChangePageAction = createAction('[InsurancesList] Change page', props<{ page: number }>());

export const insurancesListReducer = createReducer(
  initialState,
  on(ChangePageAction, (state, args) => ({
    ...state,
    page: args.page,
  }))
);
