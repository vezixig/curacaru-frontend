import { UUID } from 'angular2-uuid';

export interface Employee {
  companyId: UUID;
  email: string;
  firstName: string;
  id: UUID;
  isManager: boolean;
  lastName: string;
  phoneNumber: string;
}
