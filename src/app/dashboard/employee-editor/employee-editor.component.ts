import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Employee } from '../../models/employee.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription, first } from 'rxjs';

@Component({
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  selector: 'cura-employee-editor',
  standalone: true,
  templateUrl: './employee-editor.component.html',
})
export class EmployeeEditorComponent implements OnInit, OnDestroy {
  public isNew: boolean = true;
  public employeeForm: FormGroup;

  private employeeId: string | undefined;
  private httpSubscription: Subscription | undefined = undefined;

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
    this.httpSubscription?.unsubscribe();
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
    this.httpSubscription?.unsubscribe();

    this.httpSubscription = this.httpClient.post('https://localhost:7077/employee/new', employee).subscribe({
      complete: () => {
        this.toastr.success('Ein neuer Mitarbeiter wurde angelegt');
        this.router.navigate(['/dashboard/employee']);
      },
      error: (error) => {
        this.toastr.error('Mitarbeiter konnte nicht angelegt werden: ' + error.message);
      },
    });
  }

  private LoadEmployee(): void {
    this.isNew = false;
    this.employeeId = this.router.url.split('/').pop();
    this.httpClient
      .get<Employee>(`https://localhost:7077/employee/${this.employeeId}`)
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.employeeForm.get('id')?.setValue(result.id);
          this.employeeForm.get('firstName')?.setValue(result.firstName);
          this.employeeForm.get('lastName')?.setValue(result.lastName);
          this.employeeForm.get('email')?.setValue(result.email);
          this.employeeForm.get('phone')?.setValue(result.phoneNumber);
          this.employeeForm.get('role')?.setValue(result.isManager ? 'manager' : 'employee');
        },
        error: (error) => {
          this.toastr.error('Mitarbeiter konnte nicht geladen werden: ' + error.message);
        },
      });
  }

  private UpdateEmployee(employee: Employee) {
    this.httpSubscription?.unsubscribe();

    this.httpSubscription = this.httpClient.put<Employee>('https://localhost:7077/employee', employee).subscribe({
      complete: () => {
        this.toastr.success('Änderungen am Mitarbeiter wurden gespeichert');
        this.router.navigate(['/dashboard/employee']);
      },
      error: (error) => {
        this.toastr.error('Fehler beim Speichern der Änderungen: ' + error.message);
      },
    });
  }
}
