import { RideCostsType } from '@curacaru/enums/ride-cost-type.enum';

export interface Company {
  bic: string;
  employeeSalary: number;
  iban: string;
  institutionCode: string;
  name: string;
  ownerName: string;
  pricePerHour: number;
  recognitionDate: Date;
  rideCosts: number;
  rideCostsType: RideCostsType;
  serviceId: string;
  street: string;
  taxNumber: string;
  zipCode: string;
}
