export interface WorkingTimeReportSignature {
  employeeId: number;
  employeeName: string;
  month: number;
  year: number;
  workingHours: number;
  signatureDate: Date;
  signatureCity: string;
  signature: string;
}
