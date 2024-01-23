import { RideCostsType } from '@curacaru/enums/ride-cost-type.enum';
import { UUID } from 'angular2-uuid';

export interface UserEmployee {
  companyName: string;
  companyId: UUID;
  companyRideCostsType: RideCostsType;
  id: UUID;
  firstName: string;
  isManager: boolean;
  lastName: string;
}
