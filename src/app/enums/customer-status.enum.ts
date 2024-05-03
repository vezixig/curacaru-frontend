/** A biological gender */
export enum CustomerStatus {
  Interested = 0,
  Customer = 1,
  Former = 2,
}

/**
 * Transforms a customer status to a string
 * @param status The status
 * @returns a string representation of the status
 */
export function CustomerStatusToString(status: CustomerStatus): string {
  switch (status) {
    case CustomerStatus.Interested:
      return 'Interessent';
    case CustomerStatus.Customer:
      return 'Kunde';
    case CustomerStatus.Former:
      return 'Ehemaliger Kunde';
    default:
      return 'Unbekannt';
  }
}
