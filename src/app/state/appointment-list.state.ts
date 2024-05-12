import { DateTimeService } from '@curacaru/services';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { createActionGroup, createReducer, on, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';

export interface AppointmentListState {
  employeeId?: UUID;
  customerId?: UUID;
  dateStart: NgbDate;
  dateEnd: NgbDate;
  page: number;
}

const initialState: AppointmentListState = {
  employeeId: undefined,
  customerId: undefined,
  dateStart: DateTimeService.getStartAndEndOfWeek().start,
  dateEnd: DateTimeService.getStartAndEndOfWeek().end,
  page: 1,
};

export const AppointmentListActions = createActionGroup({
  source: 'Appointment List',
  events: {
    'Change employee filter': props<{ employeeId?: UUID }>(),
    'Change customer filter': props<{ customerId?: UUID }>(),
    'Change date filter': props<{ dateStart: NgbDate; dateEnd: NgbDate }>(),
    'Change page': props<{ page: number }>(),
  },
});

export const appointmentListReducer = createReducer(
  initialState,
  on(AppointmentListActions.changeCustomerFilter, (state, args) => ({
    ...state,
    page: 1,
    customerId: args.customerId,
  })),
  on(AppointmentListActions.changeEmployeeFilter, (state, args) => ({
    ...state,
    page: 1,
    employeeId: args.employeeId,
  })),
  on(AppointmentListActions.changeDateFilter, (state, args) => ({
    ...state,
    page: 1,
    dateStart: args.dateStart,
    dateEnd: args.dateEnd,
  })),
  on(AppointmentListActions.changePage, (state, args) => ({
    ...state,
    page: args.page,
  }))
);
