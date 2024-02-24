import { UUID } from 'angular2-uuid';

export interface BudgetListEntry {
  remainingHours: number;
  totalAmount: number;
  customerName: string;
  customerId: UUID;
}
