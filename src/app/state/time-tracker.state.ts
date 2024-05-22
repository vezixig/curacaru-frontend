import { createActionGroup, createReducer, on, props } from '@ngrx/store';

export interface TimeTrackerState {
  year: number;
  month: number;
  page: number;
}

const initialState: TimeTrackerState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  page: 1,
};

export const TimeTrackerActions = createActionGroup({
  source: 'Time Tracker',
  events: {
    'Change year': props<{ year: number }>(),
    'Change month': props<{ month: number }>(),
    'Change page': props<{ page: number }>(),
  },
});

export const timeTrackerReducer = createReducer(
  initialState,
  on(TimeTrackerActions.changeYear, (state, args) => ({
    ...state,
    page: 1,
    year: args.year,
  })),
  on(TimeTrackerActions.changeMonth, (state, args) => ({
    ...state,
    page: 1,
    month: args.month,
  })),
  on(TimeTrackerActions.changePage, (state, args) => ({
    ...state,
    page: args.page,
  }))
);
