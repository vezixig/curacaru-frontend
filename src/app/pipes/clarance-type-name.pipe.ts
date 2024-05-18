import { Pipe, PipeTransform } from '@angular/core';
import { ClearanceType } from '@curacaru/enums/clearance-type';

@Pipe({
  name: 'clearanceTypeName',
  standalone: true,
})
export class ClearanceTypeNamePipe implements PipeTransform {
  transform(input: ClearanceType): string {
    switch (+input) {
      case ClearanceType.reliefAmount:
        return 'Entlastungsbetrag §45b SGB XI';
      case ClearanceType.careBenefit:
        return '..Pflegesachleistungen §36 SGB XI (max. 40%)';
      case ClearanceType.preventiveCare:
        return 'Verhinderungspflege §39 SGB XI';
      case ClearanceType.selfPayment:
        return 'Selbstzahler';
      default:
        return 'Unbekannt';
    }
  }
}
