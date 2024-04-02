import { Pipe, type PipeTransform } from '@angular/core';
import { RideCostsType } from '@curacaru/enums/ride-cost-type.enum';

@Pipe({
  name: 'rideCostsTypeName',
  standalone: true,
})
export class RideCostsTypeNamePipe implements PipeTransform {
  transform(input: RideCostsType): string {
    switch (input) {
      case RideCostsType.Inclusive:
        return 'Inklusive';
      case RideCostsType.FlatRate:
        return 'je Einsatz (Pauschale)';
      case RideCostsType.Kilometer:
        return 'je Kilometer';
      case RideCostsType.None:
        return 'Keine';
      default:
        return 'Unbekannt';
    }
  }
}
