import { UUID } from 'angular2-uuid';

export interface Budget {
  preventiveCareRaise: number;
  careBenefitAmount: number;
  careBenefitRaise: number;
  customerId: UUID;
  customerName: string;
  pricePerHour: number;
  doClearanceCareBenefit: boolean;
  doClearancePreventiveCare: boolean;
  doClearanceReliefAmount: boolean;
  doClearanceSelfPayment: boolean;
  id: UUID;
  preventiveCareAmount: number;
  reliefAmount: number;
  reliefAmountCurrentYear?: number;
  reliefAmountPreviousYear?: number;
  reliefAmountRaise?: number;
  selfPayAmount: number;
  selfPayRaise: number;
}
