import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Employee } from '../../models/employee.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription, first } from 'rxjs';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  imports: [CommonModule, NgxSkeletonLoaderModule, RouterModule, ReactiveFormsModule],
  selector: 'cura-employee-editor',
  standalone: true,
  templateUrl: './employee-editor.component.html',
})
export class EmployeeEditorComponent implements OnInit, OnDestroy {
  employeeForm: FormGroup;
  isNew: boolean = true;
  isLoading: boolean = false;
  isSaving: boolean = false;

  private employeeId: string | undefined;
  private createEmployeeSubscription: Subscription | undefined = undefined;
  private getEmployeeSubscription?: Subscription;
  private updateEmployeeSubscription?: Subscription;

  constructor(private formBuilder: FormBuilder, private httpClient: HttpClient, private router: Router, private toastr: ToastrService) {
    this.employeeForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      role: ['employee', [Validators.required]],
      id: [''],
    });
  }
  ngOnDestroy(): void {
    this.createEmployeeSubscription?.unsubscribe();
    this.getEmployeeSubscription?.unsubscribe();
    this.updateEmployeeSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    if (this.router.url === '/dashboard/employee/new') {
      this.isNew = true;
    } else {
      this.LoadEmployee();
    }
  }

  handleSave(): void {
    const employee: Employee = {
      email: this.employeeForm.get('email')?.value,
      firstName: this.employeeForm.get('firstName')?.value,
      lastName: this.employeeForm.get('lastName')?.value,
      phoneNumber: this.employeeForm.get('phone')?.value,
      isManager: this.employeeForm.get('role')?.value === 'manager',
      companyId: '',
      id: this.employeeForm.get('id')?.value,
    };

    this.isNew ? this.CreateEmployee(employee) : this.UpdateEmployee(employee);
  }

  private CreateEmployee(employee: Employee) {
    this.isSaving = true;
    this.createEmployeeSubscription?.unsubscribe();
    this.createEmployeeSubscription = this.httpClient.post('https://localhost:7077/employee/new', employee).subscribe({
      complete: () => {
        this.toastr.success('Ein neuer Mitarbeiter wurde angelegt');
        this.router.navigate(['/dashboard/employee']);
      },
      error: (error) => {
        this.toastr.error(`Mitarbeiter konnte nicht angelegt werden: [${error.status}] ${error.error}`);
        this.isSaving = false;
      },
    });
  }

  private LoadEmployee(): void {
    this.isLoading = true;
    this.isNew = false;
    this.employeeId = this.router.url.split('/').pop();
    this.getEmployeeSubscription = this.httpClient
      .get<Employee>(`https://localhost:7077/employee/${this.employeeId}`)
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.employeeForm.get('id')?.setValue(result.id);
          this.employeeForm.get('firstName')?.setValue(result.firstName);
          this.employeeForm.get('lastName')?.setValue(result.lastName);
          this.employeeForm.get('email')?.setValue(result.email);
          this.employeeForm.get('email')?.disable();
          this.employeeForm.get('phone')?.setValue(result.phoneNumber);
          this.employeeForm.get('role')?.setValue(result.isManager ? 'manager' : 'employee');
          this.isLoading = false;
        },
        error: (error) => {
          if (error.status === 404) {
            this.toastr.error('Mitarbeiter wurde nicht gefunden');
            this.router.navigate(['/dashboard/employee']);
          } else {
            this.toastr.error(`Mitarbeiter konnte nicht geladen werden: [${error.status}] ${error.error}`);
            this.isLoading = false;
          }
        },
      });
  }

  private UpdateEmployee(employee: Employee) {
    this.isSaving = true;
    this.updateEmployeeSubscription?.unsubscribe();
    this.updateEmployeeSubscription = this.httpClient.put<Employee>('https://localhost:7077/employee', employee).subscribe({
      complete: () => {
        this.toastr.success('Änderungen am Mitarbeiter wurden gespeichert');
        this.router.navigate(['/dashboard/employee']);
      },
      error: (error) => {
        this.toastr.error(`Fehler beim Speichern der Änderungen: [${error.status}] ${error.error}`);
        this.isSaving = false;
      },
    });
  }
}
