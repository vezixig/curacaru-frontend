import { UUID } from 'angular2-uuid';
import { Insurance } from './insurance.model';

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

enum InsuranceStatus {
  Statutory = 0,
  Private = 1,
  SelfPayment = 2,
}
