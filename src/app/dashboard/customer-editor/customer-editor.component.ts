import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Employee } from '../../models/employee.model';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription, first } from 'rxjs';
import { Customer } from '../../models/customer.model';

@Component({
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule],
  selector: 'cura-customer-editor',
  standalone: true,
  templateUrl: './customer-editor.component.html',
  styleUrls: ['./customer-editor.component.scss'],
})
export class CustomerEditorComponent implements OnInit, OnDestroy {
  public isNew: boolean = true;
  public customerForm: FormGroup;
  public newDeclarationOfAssignment: number | null = null;
  public employees: Employee[] = [];

  get sortedDeclarations(): number[] {
    return this.customerForm.get('declarationsOfAssignment')?.value.sort((a: number, b: number) => a - b);
  }

  private employeeId: string | undefined;
  private httpSubscription: Subscription | undefined = undefined;

  constructor(private formBuilder: FormBuilder, private httpClient: HttpClient, private router: Router, private toastr: ToastrService) {
    this.customerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      street: ['', [Validators.required, Validators.maxLength(150)]],
      zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern('^[0-9]*$')]],
      insurance: ['', [Validators.required]],
      insuredPersonNumber: ['', [Validators.required]],
      emergencyContactName: [''],
      emergencyContactPhone: [''],
      birthDate: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      careLevel: [1, [Validators.required]],
      insuranceStatus: ['', [Validators.required]],
      isCareContractAvailable: [false],
      declarationsOfAssignment: [[]],
      associatedEmployeeId: ['', [Validators.required]],
    });

    this.customerForm.valueChanges.subscribe((value) => {
      this.logValidationErrors();
    });

    this.httpSubscription = this.httpClient
      .get<Employee[]>('https://localhost:7077/employee/list')
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.employees = result;
        },
        error: (error) => {
          this.toastr.error('Mitarbeiterliste konnte nicht abgerufen werden: ' + error.message);
        },
      });
  }
  ngOnDestroy(): void {
    this.httpSubscription?.unsubscribe();
  }

  logValidationErrors(group: FormGroup = this.customerForm, controlName?: string): void {
    Object.keys(group.controls).forEach((key: string) => {
      const abstractControl = group.get(key);

      if (abstractControl instanceof FormGroup) {
        this.logValidationErrors(abstractControl, key);
      } else {
        if (controlName) {
          console.log(`Control: ${controlName}.${key}, Errors: ${JSON.stringify(abstractControl?.errors)}`);
        } else {
          console.log(`Control: ${key}, Errors: ${JSON.stringify(abstractControl?.errors)}`);
        }
      }
    });
  }

  ngOnInit(): void {
    if (this.router.url.endsWith('new')) {
      this.isNew = true;
    } else {
      this.LoadEmployee();
    }
  }

  handleAddDeclarationOfAssignment(event: Event | undefined = undefined) {
    event?.preventDefault();
    if (this.newDeclarationOfAssignment != null && this.newDeclarationOfAssignment >= 2000 && this.newDeclarationOfAssignment < 9999 && !this.customerForm.get('declarationsOfAssignment')?.value.includes(this.newDeclarationOfAssignment)) {
      this.customerForm.get('declarationsOfAssignment')?.value.push(this.newDeclarationOfAssignment);
      this.newDeclarationOfAssignment = null;
    }
  }

  handleRemoveDeclarationOfAssignment(year: number) {
    this.customerForm.get('declarationsOfAssignment')?.value.splice(this.customerForm.get('declarationsOfAssignment')?.value.indexOf(year), 1);
  }

  handleSave(): void {
    const customer: Customer = {
      associatedEmployeeId: this.customerForm.get('associatedEmployeeId')?.value,
      birthDate: this.customerForm.get('birthDate')?.value,
      firstName: this.customerForm.get('firstName')?.value,
      lastName: this.customerForm.get('lastName')?.value,
      phone: this.customerForm.get('phone')?.value,
      companyId: this.isNew ? null : null,
      street: this.customerForm.get('street')?.value,
      zipCode: this.customerForm.get('zipCode')?.value,
      careLevel: this.customerForm.get('careLevel')?.value,
      isCareContractAvailable: this.customerForm.get('isCareContractAvailable')?.value,
      declarationsOfAssignment: this.customerForm.get('declarationsOfAssignment')?.value,
      emergencyContactName: this.customerForm.get('emergencyContactName')?.value,
      emergencyContactPhone: this.customerForm.get('emergencyContactPhone')?.value,
      id: this.customerForm.get('id')?.value,
    };

    this.isNew ? this.CreateCustomer(customer) : this.UpdateEmployee(customer);
  }

  private CreateCustomer(employee: Customer) {
    this.httpSubscription?.unsubscribe();

    this.httpSubscription = this.httpClient.post('https://localhost:7077/customers/new', employee).subscribe({
      complete: () => {
        this.toastr.success('Ein neuer Kunde wurde angelegt');
        this.router.navigate(['/dashboard/customer']);
      },
      error: (error) => {
        this.toastr.error('Kunde konnte nicht angelegt werden: ' + error.message);
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
          this.customerForm.get('id')?.setValue(result.id);
          this.customerForm.get('firstName')?.setValue(result.firstName);
          this.customerForm.get('lastName')?.setValue(result.lastName);
          this.customerForm.get('email')?.setValue(result.email);
          this.customerForm.get('email')?.disable();
          this.customerForm.get('phone')?.setValue(result.phoneNumber);
          this.customerForm.get('role')?.setValue(result.isManager ? 'manager' : 'employee');
        },
        error: (error) => {
          this.toastr.error('Mitarbeiter konnte nicht geladen werden: ' + error.message);
        },
      });
  }

  private UpdateEmployee(customer: Customer) {
    // this.httpSubscription?.unsubscribe();
    // this.httpSubscription = this.httpClient.put<Employee>('https://localhost:7077/employee', employee).subscribe({
    //   complete: () => {
    //     this.toastr.success('Änderungen am Mitarbeiter wurden gespeichert');
    //     this.router.navigate(['/dashboard/employee']);
    //   },
    //   error: (error) => {
    //     this.toastr.error('Fehler beim Speichern der Änderungen: ' + error.message);
    //   },
    // });
  }
}
