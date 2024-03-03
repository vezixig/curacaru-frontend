import { Routes } from '@angular/router';
import { ManagerGuard } from './guards/manger.guard';

export const routes: Routes = [
  {
    path: 'dashboard/appointments',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () =>
          import('@curacaru/dashboard/appointments/appointments-list/appointments-list.component').then((o) => o.AppointmentsListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('@curacaru/dashboard/appointments/appointments-editor/appointments-editor.component').then((o) => o.AppointmentsEditorComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('@curacaru/dashboard/appointments/appointments-editor/appointments-editor.component').then((o) => o.AppointmentsEditorComponent),
      },
    ],
  },
  {
    path: 'dashboard/budgets',
    canActivate: [ManagerGuard],
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () => import('@curacaru/dashboard/budgets/budgets-list/budgets-list.component').then((o) => o.BudgetListComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('@curacaru/dashboard/budgets/budgets-editor/budgets-editor.component').then((o) => o.BudgetsEditorComponent),
      },
    ],
  },
  {
    path: 'dashboard/company',
    canActivate: [ManagerGuard],
    loadComponent: () => import('@curacaru/dashboard/company/company.component').then((o) => o.CompanyComponent),
    pathMatch: 'full',
  },
  {
    path: 'dashboard/customers',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () => import('@curacaru/dashboard/customers/customer-list/customer-list.component').then((o) => o.CustomerListComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('@curacaru/dashboard/customers/customer-editor/customer-editor.component').then((o) => o.CustomerEditorComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('@curacaru/dashboard/customers/customer-editor/customer-editor.component').then((o) => o.CustomerEditorComponent),
      },
    ],
  },
  {
    path: 'dashboard/documents',
    loadComponent: () => import('@curacaru/dashboard/documents/documents.component').then((o) => o.DocumentsComponent),
  },
  {
    path: 'dashboard/employees',
    canActivate: [ManagerGuard],
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () => import('@curacaru/dashboard/employees/employee-list/employee-list.component').then((o) => o.EmployeeListComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('@curacaru/dashboard/employees/employee-editor/employee-editor.component').then((o) => o.EmployeeEditorComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('@curacaru/dashboard/employees/employee-editor/employee-editor.component').then((o) => o.EmployeeEditorComponent),
      },
    ],
  },
  {
    path: 'dashboard/insurances',
    canActivate: [ManagerGuard],
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () =>
          import('@curacaru/dashboard/insurances/insurances-list/insurances-list.component').then((o) => o.InsurancesListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('@curacaru/dashboard/insurances/insurances-editor/insurances-editor.component').then((o) => o.InsurancesEditorComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('@curacaru/dashboard/insurances/insurances-editor/insurances-editor.component').then((o) => o.InsurancesEditorComponent),
      },
    ],
  },
  { path: 'dashboard', redirectTo: 'dashboard/appointments', pathMatch: 'full' },
];
