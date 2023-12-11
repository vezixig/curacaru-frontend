import { UUID } from 'angular2-uuid';

export interface Customer {
  associatedEmployeeId: UUID;
  birthDate: Date;
  careLevel: number;
  companyId: UUID | null;
  declarationsOfAssignment: number[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  firstName: string;
  id: UUID;
  insuranceId?: string | null;
  insuranceStatus?: InsuranceStatus | null;
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
