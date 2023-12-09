import { UUID } from 'angular2-uuid';

export interface CustomerListEntry {
  associatedEmployeeName: string;
  city: string;
  firstName: string;
  id: UUID;
  lastName: string;
  phone: string;
  zipCode: string;
}
