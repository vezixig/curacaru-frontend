import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stringCurrency',
  standalone: true,
})
export class StringCurrencyPipe implements PipeTransform {
  transform(value: string): string {
    return value
      .toString()
      .replace(/[^\d,]/g, '') // Remove all non-numeric characters except commas
      .split(',')
      .slice(0, 2) // Keep only whole and decimal parts
      .join(',')
      .replace(/(?<=,\d{2})\d+/g, ''); // Remove all decimal places after the second one
  }

  finishEditing(value: string): string {
    if (value.includes(',')) {
      var digits = value.split(',')[1].padEnd(2, '0');
      value = value.split(',')[0].padStart(1, '0') + ',' + digits;
    } else {
      value += ',00';
    }
    return value;
  }
}
