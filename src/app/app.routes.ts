import { Routes } from '@angular/router';
import { EmployeeEditorComponent } from './dashboard/employees/employee-editor/employee-editor.component';
import { EmployeeListComponent } from './dashboard/employees/employee-list/employee-list.component';
import { CustomerListComponent } from './dashboard/customers/customer-list/customer-list.component';
import { CustomerEditorComponent } from './dashboard/customers/customer-editor/customer-editor.component';
import { InsuranceListComponent } from './dashboard/insurances/insurance-list/insurance-list.component';
import { AppointmentsListComponent } from './dashboard/appointments/appointments-list/appointments-list.component';
import { AppointmentsEditorComponent } from './dashboard/appointments/appointments-editor/appointments-editor.component';

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
  { path: 'dashboard/customer/new', component: CustomerEditorComponent },
  { path: 'dashboard/customer/:id', component: CustomerEditorComponent },
  { path: 'dashboard/customer', component: CustomerListComponent },
  { path: 'dashboard/employee/new', component: EmployeeEditorComponent },
  { path: 'dashboard/employee/:id', component: EmployeeEditorComponent },
  { path: 'dashboard/employee', component: EmployeeListComponent },
  { path: 'dashboard/insurance', component: InsuranceListComponent },
  { path: 'dashboard', redirectTo: 'dashboard/appointments', pathMatch: 'full' },
];
