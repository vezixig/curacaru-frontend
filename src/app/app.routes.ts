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
        loadComponent: () =>
          import('@curacaru/dashboard/administration/budgets/budgets-list/budgets-list.component').then((o) => o.BudgetListComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('@curacaru/dashboard/administration/budgets/budgets-editor/budgets-editor.component').then((o) => o.BudgetsEditorComponent),
      },
    ],
  },
  {
    path: 'dashboard/company',
    canActivate: [ManagerGuard],
    loadComponent: () => import('@curacaru/dashboard/administration/company/company.component').then((o) => o.CompanyComponent),
    pathMatch: 'full',
  },
  {
    path: 'dashboard/customers',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () =>
          import('@curacaru/dashboard/base-data/customers/customer-list/customer-list.component').then((o) => o.CustomerListComponent),
      },
      {
        path: 'new',
        canActivate: [ManagerGuard],
        loadComponent: () =>
          import('@curacaru/dashboard/base-data/customers/customer-editor/customer-editor.component').then((o) => o.CustomerEditorComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('@curacaru/dashboard/base-data/customers/customer-editor/customer-editor.component').then((o) => o.CustomerEditorComponent),
      },
    ],
  },
  {
    path: 'dashboard/documents/deployment-reports',
    loadComponent: () =>
      import('@curacaru/dashboard/documents/deployment-reports/deployment-reports-list/deployment-reports.list.component').then(
        (o) => o.DeploymentReportsListComponent
      ),
  },
  {
    path: 'dashboard/documents/deployment-reports/sign',
    pathMatch: 'full',
    loadComponent: () =>
      import('@curacaru/dashboard/documents/deployment-reports/deployment-report-editor/deployment-report-editor.component').then(
        (o) => o.DeploymentReportEditorComponent
      ),
  },
  {
    path: 'dashboard/documents/assignment-declarations',
    pathMatch: 'full',
    loadComponent: () =>
      import('@curacaru/dashboard/documents/assignment-declarations/assignment-declarations-list/assignment-declarations-list.component').then(
        (o) => o.AssignmentDeclarationsListComponent
      ),
  },
  {
    path: 'dashboard/documents/assignment-declarations/sign',
    pathMatch: 'full',
    loadComponent: () =>
      import('@curacaru/dashboard/documents/assignment-declarations/assignment-declaration-editor/assignment-declaration-editor.component').then(
        (o) => o.AssignmentDeclarationEditorComponent
      ),
  },
  {
    path: 'dashboard/employees',
    canActivate: [ManagerGuard],
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () =>
          import('@curacaru/dashboard/base-data/employees/employee-list/employee-list.component').then((o) => o.EmployeeListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('@curacaru/dashboard/base-data/employees/employee-editor/employee-editor.component').then((o) => o.EmployeeEditorComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('@curacaru/dashboard/base-data/employees/employee-editor/employee-editor.component').then((o) => o.EmployeeEditorComponent),
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
          import('@curacaru/dashboard/administration/insurances/insurances-list/insurances-list.component').then((o) => o.InsurancesListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('@curacaru/dashboard/administration/insurances/insurances-editor/insurances-editor.component').then(
            (o) => o.InsurancesEditorComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('@curacaru/dashboard/administration/insurances/insurances-editor/insurances-editor.component').then(
            (o) => o.InsurancesEditorComponent
          ),
      },
    ],
  },
  {
    path: 'dashboard/invoices',
    canActivate: [ManagerGuard],
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () =>
          import('@curacaru/dashboard/administration/invoices/invoices-list/invoices-list.component').then((o) => o.InvoicesListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('@curacaru/dashboard/administration/invoices/invoices-editor/invoices-editor.component').then((o) => o.InvoicesEditorComponent),
      },
    ],
  },
  {
    path: 'dashboard/profile',
    pathMatch: 'full',
    loadComponent: () => import('@curacaru/dashboard/profile/profile.component').then((o) => o.ProfileComponent),
  },
  {
    path: 'dashboard/time-tracker',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () =>
          import('@curacaru/dashboard/documents/time-tracker/time-tracker-list/time-tracker-list.component').then((o) => o.TimeTrackerListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('@curacaru/dashboard/documents/time-tracker/time-tracker-editor/time-tracker-editor.component').then(
            (o) => o.TimeTrackerEditorComponent
          ),
      },
    ],
  },
  {
    path: 'dashboard/version',
    pathMatch: 'full',
    loadComponent: () => import('@curacaru/dashboard/version-info/version-info.component').then((o) => o.VersionInfoComponent),
  },

  {
    path: 'dashboard/administration/website-integration',
    canActivate: [ManagerGuard],
    pathMatch: 'full',
    loadComponent: () =>
      import('@curacaru/dashboard/administration/website-integration/website-integration.component').then((o) => o.WebsiteIntegrationComponent),
  },
  { path: 'dashboard', redirectTo: 'dashboard/appointments', pathMatch: 'full' },
];
