import { Routes } from '@angular/router';
import { EmployeeEditorComponent } from './dashboard/employee-editor/employee-editor.component';
import { EmployeeListComponent } from './dashboard/employee-list/employee-list.component';

export const routes: Routes = [
  { path: 'dashboard', redirectTo: 'dashboard/employee', pathMatch: 'full' },
  { path: 'dashboard/employee', component: EmployeeListComponent },
  { path: 'dashboard/employee/new', component: EmployeeEditorComponent },
];
