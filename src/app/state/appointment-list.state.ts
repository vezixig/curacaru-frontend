import { DateTimeService } from '@curacaru/services';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { createActionGroup, createReducer, on, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';

export interface AppointmentListState {
  employeeId?: UUID;
  customerId?: UUID;
  dateStart: NgbDate;
  dateEnd: NgbDate;
}

const initialState: AppointmentListState = {
  employeeId: undefined,
  customerId: undefined,
  dateStart: DateTimeService.getStartAndEndOfWeek().start,
  dateEnd: DateTimeService.getStartAndEndOfWeek().end,
};

export const AppointmentListActions = createActionGroup({
  source: 'Appointment List',
  events: {
    'Change employee filter': props<{ employeeId?: UUID }>(),
    'Change customer filter': props<{ customerId?: UUID }>(),
    'Change date filter': props<{ dateStart: NgbDate; dateEnd: NgbDate }>(),
  },
});

export const appointmentListReducer = createReducer(
  initialState,
  on(AppointmentListActions.changeCustomerFilter, (state, args) => ({
    ...state,
    customerId: args.customerId,
  })),
  on(AppointmentListActions.changeEmployeeFilter, (state, args) => ({
    ...state,
    employeeId: args.employeeId,
  })),
  on(AppointmentListActions.changeDateFilter, (state, args) => ({
    ...state,
    dateStart: args.dateStart,
    dateEnd: args.dateEnd,
  }))
);
