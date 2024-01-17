import { UUID } from 'angular2-uuid';
import { Insurance } from './insurance.model';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';

export interface Customer {
  associatedEmployeeId: UUID;
  birthDate: Date;
  careLevel: number;
  declarationsOfAssignment: number[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  firstName: string;
  id?: UUID;
  insuranceId?: UUID;
  insurance?: Insurance;
  insuredPersonNumber?: string;
  insuranceStatus?: InsuranceStatus;
  isCareContractAvailable: boolean;
  lastName: string;
  phone: string;
  street: string;
  zipCode: string;
}
