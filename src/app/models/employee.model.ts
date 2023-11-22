import { UUID } from 'angular2-uuid';

export interface Employee {
  id: UUID;
  firstName: string;
  lastName: string;
  companyId: UUID;
  Email: string;
}
