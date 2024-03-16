import { UUID } from 'angular2-uuid';

export interface AssignmentDeclarationListEntry {
  assignmentDeclarationId: UUID;
  customerId: UUID;
  customerName: string;
  employeeName: string;
  isSigned: boolean;
  year: number;
}
