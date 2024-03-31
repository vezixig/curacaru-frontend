import { createActionGroup, createReducer, on, props } from '@ngrx/store';

export interface TimeTrackerState {
  year: number;
  month: number;
}

const initialState: TimeTrackerState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
};

export const TimeTrackerActions = createActionGroup({
  source: 'Time Tracker',
  events: {
    'Change year': props<{ year: number }>(),
    'Change month': props<{ month: number }>(),
  },
});

export const timeTrackerReducer = createReducer(
  initialState,
  on(TimeTrackerActions.changeYear, (state, args) => ({
    ...state,
    year: args.year,
  })),
  on(TimeTrackerActions.changeMonth, (state, args) => ({
    ...state,
    month: args.month,
  }))
);
