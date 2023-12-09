import { Routes } from '@angular/router';
import { EmployeeEditorComponent } from './dashboard/employee-editor/employee-editor.component';
import { EmployeeListComponent } from './dashboard/employee-list/employee-list.component';
import { CustomerListComponent } from './dashboard/customer-list/customer-list.component';

export const routes: Routes = [
  { path: 'dashboard/customer', component: CustomerListComponent },
  { path: 'dashboard/employee/new', component: EmployeeEditorComponent },
  { path: 'dashboard/employee/:id', component: EmployeeEditorComponent },
  { path: 'dashboard/employee', component: EmployeeListComponent },
  { path: 'dashboard', redirectTo: 'dashboard/employee', pathMatch: 'full' },
];
