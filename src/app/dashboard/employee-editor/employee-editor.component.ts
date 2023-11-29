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
  private isNew: boolean = true;

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
    });
  }

  ngOnInit(): void {
    // todo: edit employee
  }

  handleSave(): void {
    if (this.isNew) {
      const employee: Employee = {
        email: this.employeeForm.get('email')?.value,
        firstName: this.employeeForm.get('firstName')?.value,
        lastName: this.employeeForm.get('lastName')?.value,
        phoneNumber: this.employeeForm.get('phone')?.value,
        isManager: this.employeeForm.get('role')?.value === 'manager',
        companyId: '',
        id: '',
      };

      this.httpClient
        .post('https://localhost:7077/employee/new', employee)
        .subscribe({
          complete: () => {
            console.log('Employee created');
            this.router.navigate(['/dashboard/employee']);
          },
        });
    } else {
      this.httpClient.put<Employee>('https://localhost:7077/employee', {});
    }
  }
}
