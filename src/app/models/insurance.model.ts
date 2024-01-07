import { UUID } from 'angular2-uuid';

export interface Insurance {
  id?: UUID;
  name: string;
  institutionCode: string;
  companyId?: UUID;
  city: string;
  zipCode: string;
  street: string;
}
