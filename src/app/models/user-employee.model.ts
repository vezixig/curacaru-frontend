import { UUID } from 'angular2-uuid';

export interface UserEmployee {
  companyName: string;
  companyId: UUID;
  firstName: string;
  isManager: boolean;
  lastName: string;
}
