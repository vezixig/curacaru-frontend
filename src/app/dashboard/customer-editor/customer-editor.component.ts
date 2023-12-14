import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Employee } from '../../models/employee.model';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription, first } from 'rxjs';
import { Customer } from '../../models/customer.model';
import { UUID } from 'angular2-uuid';

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
  public CityName: string = '';

  // Gets the two newest declarations of assignment
  get sortedDeclarations(): number[] {
    return this.customerForm
      .get('declarationsOfAssignment')
      ?.value.sort((a: number, b: number) => b - a)
      .slice(0, 2);
  }

  private customerId: UUID | null = null;

  private getZipCodeSubscription: Subscription | undefined = undefined;
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

    this.customerForm.get('zipCode')?.valueChanges.subscribe((value) => {
      this.handleZipCodeChange(value);
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

  // Tries to get the name of the city for the entered zip code
  handleZipCodeChange(zipCode: string) {
    this.CityName = '';
    if (zipCode.length == 5) {
      this.getZipCodeSubscription?.unsubscribe();

      this.getZipCodeSubscription = this.httpClient
        .get(`https://localhost:7077/address/city/${zipCode}`, { responseType: 'text' })
        .pipe(first())
        .subscribe({
          next: (result) => {
            this.CityName = result;
          },
          error: (error) => {
            this.CityName = 'Unbekannte PLZ';
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.httpSubscription?.unsubscribe();
    this.getZipCodeSubscription?.unsubscribe();
  }

  logValidationErrors(group: FormGroup = this.customerForm, controlName?: string): void {
    console.log(this.employees.length);

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
      associatedEmployeeId: this.customerForm.get('associatedEmployeeId')?.value.toString(),
      birthDate: this.customerForm.get('birthDate')?.value,
      firstName: this.customerForm.get('firstName')?.value,
      lastName: this.customerForm.get('lastName')?.value,
      phone: this.customerForm.get('phone')?.value,
      id: this.isNew ? null : this.customerId,
      street: this.customerForm.get('street')?.value,
      zipCode: this.customerForm.get('zipCode')?.value,
      careLevel: this.customerForm.get('careLevel')?.value,
      insuredPersonNumber: this.customerForm.get('insuredPersonNumber')?.value,
      insuranceStatus: parseInt(this.customerForm.get('insuranceStatus')?.value),
      isCareContractAvailable: this.customerForm.get('isCareContractAvailable')?.value,
      declarationsOfAssignment: this.customerForm.get('declarationsOfAssignment')?.value,
      emergencyContactName: this.customerForm.get('emergencyContactName')?.value,
      emergencyContactPhone: this.customerForm.get('emergencyContactPhone')?.value,
    };

    this.isNew ? this.CreateCustomer(customer) : this.UpdateCustomer(customer);
  }

  private CreateCustomer(employee: Customer) {
    this.httpSubscription?.unsubscribe();

    this.httpSubscription = this.httpClient
      .post('https://localhost:7077/customer/new', employee)
      .pipe(first())
      .subscribe({
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
    this.customerId = this.router.url.split('/').pop() ?? '';
    this.httpClient
      .get<Customer>(`https://localhost:7077/customer/${this.customerId}`)
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.customerForm.patchValue({
            associatedEmployeeId: result.associatedEmployeeId,
            birthDate: result.birthDate,
            careLevel: result.careLevel,
            declarationsOfAssignment: result.declarationsOfAssignment,
            emergencyContactName: result.emergencyContactName,
            emergencyContactPhone: result.emergencyContactPhone,
            firstName: result.firstName,
            id: result.id,
            insuranceStatus: result.insuranceStatus,
            insuredPersonNumber: result.insuredPersonNumber,
            isCareContractAvailable: result.isCareContractAvailable,
            lastName: result.lastName,
            phone: result.phone,
            street: result.street,
            zipCode: result.zipCode,
          });

          // this.customerForm.get('insurance')?.setValue(result.insurance);
        },
        error: (error) => {
          this.toastr.error('Mitarbeiter konnte nicht geladen werden: ' + error.message);
        },
      });
  }

  private UpdateCustomer(customer: Customer) {
    this.httpSubscription?.unsubscribe();
    this.httpSubscription = this.httpClient.put<Customer>('https://localhost:7077/customer', customer).subscribe({
      complete: () => {
        this.toastr.success('Änderungen am Kunden wurden gespeichert');
        this.router.navigate(['/dashboard/customer']);
      },
      error: (error) => {
        this.toastr.error('Fehler beim Speichern der Änderungen: ' + error.message);
      },
    });
  }
}
