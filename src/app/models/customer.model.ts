import { UUID } from 'angular2-uuid';
import { Insurance } from './insurance.model';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { Gender } from '@curacaru/enums/gender.enum';

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
  /** The salutation of the customer based on the gender */
  salutation: Gender;
  street: string;
  zipCode: string;
  /**
   * A value indicating whether clearance can be done through the relief amount.
   * @see https://www.bundesgesundheitsministerium.de/entlastungsbetrag
   */
  doClearanceReliefAmount: boolean;

  /**
   * A value indicating whether clearance can be done through care benefit in kind.
   * @see https://www.bundesgesundheitsministerium.de/pflegedienst-und-pflegesachleistungen
   */
  doClearanceCareBenefit: boolean;
}
