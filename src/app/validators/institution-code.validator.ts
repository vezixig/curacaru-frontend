import { AbstractControl } from '@angular/forms';

/**
 *
 * @param control The form control to validate
 * @returns null if the control is valid, otherwise an error object
 * @see https://de.wikipedia.org/wiki/Institutionskennzeichen
 */
export function ValidateInstitutionCode(control: AbstractControl) {
  if (control.value == null || control.value == '') return null;

  try {
    const asNumbers: number[] = control.value.split('').map(Number);
    // The first two digits are identification numbers, the ones in between are for the sum
    const parts: number[] = asNumbers.slice(2, -1);
    // The last digit is the control number
    const controlNumber: number = asNumbers[asNumbers.length - 1];

    let sum = 0;
    for (let i = 0; i < parts.length; i++) {
      const product = parts[i] * (i % 2 === 1 ? 1 : 2);
      sum += product > 9 ? product - 9 : product;
    }

    return sum % 10 === controlNumber ? null : { invalidNumber: true };
  } catch (exception) {
    return { invalidNumber: true };
  }
}
