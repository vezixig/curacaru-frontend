import { Routes } from '@angular/router';
import { EmployeeListComponent } from './dashboard/employee-list/employee-list-component';

export const routes: Routes = [
  { path: 'dashboard', redirectTo: 'dashboard/employee', pathMatch: 'full' },
  { path: 'dashboard/employee', component: EmployeeListComponent },
];
