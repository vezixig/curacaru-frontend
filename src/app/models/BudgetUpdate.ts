import { type UUID } from 'angular2-uuid';

export interface BudgetUpdate {
  id: UUID;
  preventiveCareAmount: number;
  careBenefitAmount: number;
  reliefAmount: number;
  selfPayAmount: number;
  selfPayRaise: number;
}
