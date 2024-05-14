import { createAction, createReducer, on, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';

export interface InvoicesListState {
  year: number;
  month: number;
  customerId?: UUID;
  page: number;
}

export const initialState: InvoicesListState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  customerId: undefined,
  page: 1,
};

export const InvoicesChangeFilterAction = createAction('[Invoices List] Change filter', props<{ year: number; month: number; customerId?: UUID }>());

export const InvoiceChangeCustomerAction = createAction('[Invoices List] Change customer', props<{ customerId?: UUID }>());

export const InvoiceChangePageAction = createAction('[Invoices List] Change page', props<{ page: number }>());

export const invoicesListReducer = createReducer(
  initialState,
  on(InvoicesChangeFilterAction, (state, args) => ({
    ...state,
    page: 1,
    year: args.year,
    month: args.month,
    customerId: args.customerId,
  })),
  on(InvoiceChangeCustomerAction, (state, args) => ({
    ...state,
    page: 1,
    customerId: args.customerId,
  })),
  on(InvoiceChangePageAction, (state, args) => ({
    ...state,
    page: args.page,
  }))
);
