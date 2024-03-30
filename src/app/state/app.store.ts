import { Action, ActionReducer } from '@ngrx/store';
import { CustomerListState, customerReducer } from './customer-list.state';

export interface AppStore {
  customerList: ActionReducer<CustomerListState, Action>;
}

export const appStore: AppStore = {
  customerList: customerReducer,
};
