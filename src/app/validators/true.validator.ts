import { AbstractControl } from '@angular/forms';

export function ValidateTrue(control: AbstractControl) {
  if (control.value === true) return null;
  return { invalid: true };
}
