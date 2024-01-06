import { AbstractControl } from '@angular/forms';

export function ValidateCurrency(control: AbstractControl) {
  if (control.value == null || control.value == '') return null;

  if (isNaN(control.value)) return { invalidNumber: true };

  const decimalPart = control.value.toString().split('.')[1];
  if (decimalPart && decimalPart.length > 2) return { tooManyDecimalPlaces: true };

  return null;
}
