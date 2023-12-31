import { AbstractControl } from '@angular/forms';

/**
 *
 * @param control The form control to validate
 * @returns null if the control is valid, otherwise an error object
 * @see https://de.wikipedia.org/wiki/Krankenversichertennummer
 */
export function ValidateInsuredPersonNumber(control: AbstractControl) {
  if (control.value == null || control.value == '') return null;

  let m = control.value.match(/^([A-Z]{1})([\d]{8})([\d]{1})$/);
  if (m) {
    // transform first char to ascii number
    let cardNo = ('0' + (m[1].charCodeAt(0) - 64)).slice(-2) + m[2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      let digit = parseInt(cardNo[i]);
      if (i % 2 == 1) digit *= 2;
      if (digit > 9) digit -= 9;
      sum += digit;
    }
    return sum % 10 == m[3] ? null : { invalidNumber: true };
  }
  return { invalidNumber: true };
}
