import { UUID } from 'angular2-uuid';

export interface WorkingTimeReport {
  companyId: UUID;
  employeeId: UUID;
  id: UUID;
  month: number;
  signatureEmployeeDate: Date;
  signatureEmployeeCity: string;
  signatureManagerDate?: Date;
  signatureManagerCity?: string;
  totalHours: number;
  year: number;
}
