import { CustomerStatus } from '@curacaru/enums/customer-status.enum';
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
  status: CustomerStatus;
  street: string;
  zipCode: string;
}
