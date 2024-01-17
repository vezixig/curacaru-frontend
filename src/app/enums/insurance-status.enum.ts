export enum InsuranceStatus {
  Statutory = 0,
  Private = 1,
  SelfPayment = 2,
}

export function InsuranceStatusToString(status: InsuranceStatus): string {
  switch (status) {
    case InsuranceStatus.Statutory:
      return 'Gesetzlich';
    case InsuranceStatus.Private:
      return 'Privat';
    case InsuranceStatus.SelfPayment:
      return 'Selbstzahler';
    default:
      return 'Unbekannt';
  }
}
