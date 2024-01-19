/** A biological gender */
export enum Gender {
  Female = 0,
  Male = 1,
}

/**
 * Transforms a gender to a salutation string
 * @param gender The gender
 * @returns a salutation based on the gender
 */
export function GenderToSalutation(gender: Gender): string {
  switch (gender) {
    case Gender.Female:
      return 'Frau';
    case Gender.Male:
      return 'Herr';
    default:
      return 'Unbekannt';
  }
}
