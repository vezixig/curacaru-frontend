import { RideCostsType } from '@curacaru/enums/ride-cost-type.enum';

export interface CompanyPrices {
  pricePerHour: number;
  rideCosts: number;
  rideCostsType: RideCostsType;
}
