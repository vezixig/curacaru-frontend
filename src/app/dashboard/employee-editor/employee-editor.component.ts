import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Employee } from '../../models/employee.model';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  selector: 'cura-employee-editor',
  standalone: true,
  templateUrl: './employee-editor.component.html',
})
export class EmployeeEditorComponent implements OnInit {
  public isNew: boolean = true;
  private employeeId: string | undefined;
  public employeeForm: FormGroup;

  constructor(
    private httpClient: HttpClient,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.employeeForm = this.formBuilder.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(150),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(150),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      role: ['employee', [Validators.required]],
      id: [''],
    });
  }

  ngOnInit(): void {
    if (this.router.url === '/dashboard/employee/new') {
      this.isNew = true;
    } else {
      this.InitEdit();
    }
  }

  private InitEdit(): void {
    this.isNew = false;
    this.employeeId = this.router.url.split('/').pop();
    this.httpClient
      .get<Employee>(`https://localhost:7077/employee/${this.employeeId}`)
      .subscribe({
        next: (result) => {
          this.employeeForm.get('id')?.setValue(result.id);
          this.employeeForm.get('firstName')?.setValue(result.firstName);
          this.employeeForm.get('lastName')?.setValue(result.lastName);
          this.employeeForm.get('email')?.setValue(result.email);
          this.employeeForm.get('phone')?.setValue(result.phoneNumber);
          this.employeeForm
            .get('role')
            ?.setValue(result.isManager ? 'manager' : 'employee');
        },
        error: (error) => {
          console.error('API request failed:', error);
        },
      });
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

    if (this.isNew) {
      this.httpClient
        .post('https://localhost:7077/employee/new', employee)
        .subscribe({
          complete: () => {
            console.log('Employee created');
            this.router.navigate(['/dashboard/employee']);
          },
        });
    } else {
      this.httpClient
        .put<Employee>('https://localhost:7077/employee', employee)
        .subscribe({
          complete: () => {
            console.log('Employee created');
            this.router.navigate(['/dashboard/employee']);
          },
        });
    }
  }
}
