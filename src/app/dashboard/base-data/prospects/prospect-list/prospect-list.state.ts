import { createAction, createReducer, on, props } from '@ngrx/store';

export interface ProspectListState {
  page: number;
}

const initialState: ProspectListState = {
  page: 1,
};

export const ChangePageAction = createAction('[ProspectList] Change page', props<{ page: number }>());

export const prospectListReducer = createReducer(
  initialState,

  on(ChangePageAction, (state, args) => ({
    ...state,
    page: args.page,
  }))
);
