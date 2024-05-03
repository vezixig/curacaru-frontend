import { UUID } from 'angular2-uuid';
import { Insurance } from './insurance.model';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { Gender } from '@curacaru/enums/gender.enum';
import { EmployeeBasic } from './employee-basic.model';
import { CustomerStatus } from '@curacaru/enums/customer-status.enum';

export interface Customer {
  associatedEmployeeId?: UUID;
  associatedEmployee?: EmployeeBasic;
  birthDate: Date;
  careLevel: number;
  status?: CustomerStatus;
  emergencyContactName: string;
  emergencyContactPhone: string;
  firstName: string;
  id?: UUID;
  insuranceId?: UUID;
  insurance?: Insurance;
  insuredPersonNumber?: string;
  insuranceStatus: InsuranceStatus;
  lastName: string;
  phone: string;
  /** The salutation of the customer based on the gender */
  salutation: Gender;
  street: string;
  zipCode: string;
  /**
   * A value indicating whether clearance can be done through the relief amount.
   * @see https://www.bundesgesundheitsministerium.de/entlastungsbetrags
   */
  doClearanceReliefAmount: boolean;

  /**
   * A value indicating whether clearance can be done through care benefit in kind.
   * @see https://www.bundesgesundheitsministerium.de/pflegedienst-und-pflegesachleistungen
   */
  doClearanceCareBenefit: boolean;

  /**
   * A value indicating whether clearance can be done through preventive care.
   * @see https://www.gesetze-im-internet.de/sgb_11/__39.html
   */
  doClearancePreventiveCare: boolean;

  /**
   * A value indicating whether clearance can be done through self-payment.
   */
  doClearanceSelfPayment: boolean;
}
