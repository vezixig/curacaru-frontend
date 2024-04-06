import { createAction, createReducer, on, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';

export interface InvoicesListState {
  year: number;
  month: number;
  customerId?: UUID;
}

export const initialState: InvoicesListState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  customerId: undefined,
};

export const InvoicesChangeFilterAction = createAction('[Invoices List] Change filter', props<{ year: number; month: number; customerId?: UUID }>());

export const invoicesListReducer = createReducer(
  initialState,
  on(InvoicesChangeFilterAction, (state, args) => ({
    ...state,
    year: args.year,
    month: args.month,
    customerId: args.customerId,
  }))
);
