import { UUID } from 'angular2-uuid';

export interface CustomerListEntry {
  associatedEmployeeId: UUID;
  associatedEmployeeName: string;
  city: string;
  firstName: string;
  id: UUID;
  lastName: string;
  latitude: number;
  longitude: number;
  phone: string;
  street: string;
  zipCode: string;
}
