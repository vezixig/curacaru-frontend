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
  /**
   * Gets or sets a value indicating whether clearance can be done through the relief amount.
   * @see https://www.bundesgesundheitsministerium.de/entlastungsbetrag
   */
  doClearanceReliefAmount: boolean;

  /**
   * Gets or sets a value indicating whether clearance can be done through care benefit in kind.
   * @see https://www.bundesgesundheitsministerium.de/pflegedienst-und-pflegesachleistungen
   */
  doClearanceCareBenefit: boolean;
}
