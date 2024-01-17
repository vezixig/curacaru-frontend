import { Pipe, PipeTransform } from '@angular/core';
import { InsuranceStatus, InsuranceStatusToString } from '@curacaru/enums/insurance-status.enum';

@Pipe({
  name: 'insuranceStatus',
  standalone: true,
})
export class InsuranceStatusPipe implements PipeTransform {
  transform(insuranceStatus: InsuranceStatus): string {
    return InsuranceStatusToString(insuranceStatus);
  }
}
