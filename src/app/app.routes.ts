import { Routes } from '@angular/router';
import { EmployeeEditorComponent } from './dashboard/employees/employee-editor/employee-editor.component';
import { EmployeeListComponent } from './dashboard/employees/employee-list/employee-list.component';
import { CustomerListComponent } from './dashboard/customers/customer-list/customer-list.component';
import { CustomerEditorComponent } from './dashboard/customers/customer-editor/customer-editor.component';
import { AppointmentsListComponent } from './dashboard/appointments/appointments-list/appointments-list.component';
import { AppointmentsEditorComponent } from './dashboard/appointments/appointments-editor/appointments-editor.component';
import { InsurancesListComponent } from './dashboard/insurances/insurances-list/insurances-list.component';
import { InsurancesEditorComponent } from './dashboard/insurances/insurances-editor/insurances-editor.component';
import { CompanyComponent } from './dashboard/company/company.component';

export const routes: Routes = [
  {
    path: 'dashboard/appointments',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: AppointmentsListComponent },
      { path: 'new', component: AppointmentsEditorComponent },
      { path: ':id', component: AppointmentsEditorComponent },
    ],
  },
  { path: 'dashboard/company', component: CompanyComponent },
  {
    path: 'dashboard/customers',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: CustomerListComponent },
      { path: 'new', component: CustomerEditorComponent },
      { path: ':id', component: CustomerEditorComponent },
    ],
  },
  {
    path: 'dashboard/employees',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: EmployeeListComponent },
      { path: 'new', component: EmployeeEditorComponent },
      { path: ':id', component: EmployeeEditorComponent },
    ],
  },
  {
    path: 'dashboard/insurances',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: InsurancesListComponent },
      { path: 'new', component: InsurancesEditorComponent },
      { path: ':id', component: InsurancesEditorComponent },
    ],
  },
  { path: 'dashboard', redirectTo: 'dashboard/appointments', pathMatch: 'full' },
];
