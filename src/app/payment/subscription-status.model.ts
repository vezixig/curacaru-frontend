import { SubscriptionType } from './subscription-type.enum';

export interface SubscriptionStatus {
  currentCustomers: number;
  isActive: boolean;
  maxCustomers: number;
  periodEnd?: Date;
  nextPeriodStart?: Date;
  nextPeriodType?: SubscriptionType;
  type: SubscriptionType;
}
