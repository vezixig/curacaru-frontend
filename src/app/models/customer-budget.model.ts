import { UUID } from 'angular2-uuid';

export interface CustomerBudget {
  careBenefitAmount: number;
  customerId: string;
  customerName: string;
  doClearanceCareBenefit: boolean;
  doClearancePreventiveCare: boolean;
  doClearanceReliefAmount: boolean;
  doClearanceSelfPayment: boolean;
  preventiveCareAmount: number;
  reliefAmount: number;
  selfPayAmount: number;
  associatedEmployeeId?: UUID;
}
