import { Routes } from '@angular/router';
import { EmployeeEditorComponent } from './dashboard/employee-editor/employee-editor.component';
import { EmployeeListComponent } from './dashboard/employee-list/employee-list.component';
import { CustomerListComponent } from './dashboard/customer-list/customer-list.component';
import { CustomerEditorComponent } from './dashboard/customer-editor/customer-editor.component';
import { AppointmentListComponent } from './dashboard/appointment-list/appointment-list.component';
import { AppointmentEditorComponent } from './dashboard/appointment-editor/appointment-editor.component';

export const routes: Routes = [
  { path: 'dashboard/appointment/new', component: AppointmentEditorComponent },
  { path: 'dashboard/appointment', component: AppointmentListComponent },
  { path: 'dashboard/customer/new', component: CustomerEditorComponent },
  { path: 'dashboard/customer/:id', component: CustomerEditorComponent },
  { path: 'dashboard/customer', component: CustomerListComponent },
  { path: 'dashboard/employee/new', component: EmployeeEditorComponent },
  { path: 'dashboard/employee/:id', component: EmployeeEditorComponent },
  { path: 'dashboard/employee', component: EmployeeListComponent },
  { path: 'dashboard', redirectTo: 'dashboard/appointment', pathMatch: 'full' },
];
