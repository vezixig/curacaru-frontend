import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { UUID } from 'angular2-uuid';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Observable, OperatorFunction, Subscription, debounceTime, distinctUntilChanged, first, firstValueFrom, mergeMap } from 'rxjs';
import { Customer } from '../../../models/customer.model';
import { Insurance } from '../../../models/insurance.model';
import { ApiService } from '../../../services/api.service';
import { EmployeeBasic } from '../../../models/employee-basic.model';
import { ValidateInsuredPersonNumber as ValidateInsuredPersonNumber } from '../../../validators/insured-person-number.validator';
import { UserService } from '../../../services/user.service';

@Component({
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule, NgxSkeletonLoaderModule, NgbTypeaheadModule],
  providers: [ApiService],
  selector: 'cura-customer-editor',
  standalone: true,
  styleUrls: ['./customer-editor.component.scss'],
  templateUrl: './customer-editor.component.html',
})
export class CustomerEditorComponent implements OnInit, OnDestroy {
  cityName: string = '';
  customerForm: FormGroup;
  employees: EmployeeBasic[] = [];
  isLoading: boolean = false;
  isNew: boolean = true;
  isSaving: boolean = false;
  newDeclarationOfAssignment: number | null = null;
  isManager: boolean = false;

  insuranceFormatter = (insurance: Insurance) => insurance.name;

  // Gets the two newest declarations of assignment
  get sortedDeclarations(): number[] {
    return this.customerForm
      .get('declarationsOfAssignment')
      ?.value.sort((a: number, b: number) => b - a)
      .slice(0, 2);
  }

  set selectedInsurance(value: Insurance | undefined) {
    this._selectedInsurance = value;
    this.customerForm.get('insuranceId')?.setValue(value?.id ?? null);
  }

  get selectedInsurance(): Insurance | undefined {
    return this._selectedInsurance;
  }

  private customerId?: UUID;
  private _selectedInsurance: Insurance | undefined;
  private changeZipCodeSubscription?: Subscription;
  private getCustomerSubscription?: Subscription;
  private getEmployeeListSubscription?: Subscription;
  private getZipCodeSubscription?: Subscription;
  private postCustomerSubscription?: Subscription;
  private updateCustomerSubscription?: Subscription;

  constructor(private apiService: ApiService, private formBuilder: FormBuilder, private router: Router, private userService: UserService, private toastr: ToastrService) {
    this.isManager = this.userService.user?.isManager ?? false;
    this.customerForm = this.formBuilder.group({
      associatedEmployeeId: ['', [Validators.required]],
      birthDate: ['', [Validators.required]],
      careLevel: [1, [Validators.required]],
      declarationsOfAssignment: [[]],
      doClearanceCareBenefit: [false],
      doClearanceReliefAmount: [false],
      emergencyContactName: [''],
      emergencyContactPhone: [''],
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      insuranceId: [''],
      insuranceStatus: ['', [Validators.required]],
      insuredPersonNumber: ['', [ValidateInsuredPersonNumber]],
      isCareContractAvailable: [false],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      phone: [''],
      salutation: [0],
      street: ['', [Validators.required, Validators.maxLength(150)]],
      zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern('^[0-9]*$')]],
    });

    this.customerForm.get('careLevel')?.valueChanges.subscribe((value) => this.onCareLEvelChange(value));

    if (!this.isManager) {
      this.customerForm.disable();
    }

    this.changeZipCodeSubscription = this.customerForm.get('zipCode')?.valueChanges.subscribe((value) => {
      this.handleZipCodeChange(value);
    });

    this.getEmployeeListSubscription = this.apiService.getEmployeeBaseList().subscribe({
      next: (result) => (this.employees = result),
      error: (error) => this.toastr.error(`Mitarbeiterliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`),
    });
  }

  ngOnDestroy(): void {
    this.changeZipCodeSubscription?.unsubscribe();
    this.getCustomerSubscription?.unsubscribe();
    this.getEmployeeListSubscription?.unsubscribe();
    this.getZipCodeSubscription?.unsubscribe();
    this.postCustomerSubscription?.unsubscribe();
    this.updateCustomerSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    if (this.router.url.endsWith('new')) {
      this.isNew = true;
    } else {
      this.LoadCustomer();
    }
  }

  // Tries to get the name of the city for the entered zip code
  handleZipCodeChange(zipCode: string) {
    this.cityName = '';
    if (zipCode.length == 5) {
      this.getZipCodeSubscription?.unsubscribe();
      this.getZipCodeSubscription = this.apiService.getCityName(zipCode).subscribe({
        next: (result) => (this.cityName = result),
        error: (error) => {
          this.cityName = 'Unbekannte PLZ';
          this.customerForm.get('zipCode')?.setErrors({ unknownZipCode: true });
        },
      });
    }
  }

  // Function for the typeahead to search for insurances
  search: OperatorFunction<string, readonly Insurance[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      mergeMap(async (term) => {
        if (term.length < 2) return [];

        let insurances = await firstValueFrom(this.apiService.getInsuranceByName(term));
        return insurances;
      })
    );

  handleAddDeclarationOfAssignment(event: Event | undefined = undefined) {
    event?.preventDefault();
    if (this.newDeclarationOfAssignment != null && this.newDeclarationOfAssignment >= 2000 && this.newDeclarationOfAssignment < 9999 && !this.customerForm.get('declarationsOfAssignment')?.value.includes(this.newDeclarationOfAssignment)) {
      this.customerForm.get('declarationsOfAssignment')?.value.push(this.newDeclarationOfAssignment);
      this.newDeclarationOfAssignment = null;
    }
  }

  handleRemoveDeclarationOfAssignment(year: number) {
    if (!this.isManager) return;
    this.customerForm.get('declarationsOfAssignment')?.value.splice(this.customerForm.get('declarationsOfAssignment')?.value.indexOf(year), 1);
  }

  handleSave(): void {
    const customer: Customer = {
      associatedEmployeeId: this.customerForm.get('associatedEmployeeId')?.value.toString(),
      birthDate: this.customerForm.get('birthDate')?.value,
      careLevel: this.customerForm.get('careLevel')?.value,
      declarationsOfAssignment: this.customerForm.get('declarationsOfAssignment')?.value,
      doClearanceCareBenefit: this.customerForm.get('doClearanceCareBenefit')?.value,
      doClearanceReliefAmount: this.customerForm.get('doClearanceReliefAmount')?.value,
      emergencyContactName: this.customerForm.get('emergencyContactName')?.value,
      emergencyContactPhone: this.customerForm.get('emergencyContactPhone')?.value,
      firstName: this.customerForm.get('firstName')?.value,
      id: this.isNew ? undefined : this.customerId,
      insuranceId: this.customerForm.get('insuranceId')?.value,
      insuranceStatus: +this.customerForm.get('insuranceStatus')?.value,
      insuredPersonNumber: this.customerForm.get('insuredPersonNumber')?.value,
      isCareContractAvailable: this.customerForm.get('isCareContractAvailable')?.value,
      lastName: this.customerForm.get('lastName')?.value,
      phone: this.customerForm.get('phone')?.value,
      salutation: +this.customerForm.get('salutation')?.value,
      street: this.customerForm.get('street')?.value,
      zipCode: this.customerForm.get('zipCode')?.value,
    };

    console.log(customer);

    customer.insuranceId = customer.insuranceId === '' ? undefined : customer.insuranceId;

    this.isNew ? this.CreateCustomer(customer) : this.UpdateCustomer(customer);
  }

  private CreateCustomer(employee: Customer) {
    this.isSaving = true;
    this.postCustomerSubscription?.unsubscribe();
    this.postCustomerSubscription = this.apiService.createCustomer(employee).subscribe({
      complete: () => {
        this.toastr.success('Ein neuer Kunde wurde angelegt');
        this.router.navigate(['/dashboard/customers']);
      },
      error: (error) => {
        this.toastr.error(`Kunde konnte nicht angelegt werden: [${error.status}] ${error.error}`);
        this.isSaving = false;
      },
    });
  }

  private LoadCustomer(): void {
    this.isNew = false;
    this.isLoading = true;
    this.customerId = this.router.url.split('/').pop() ?? '';
    this.getCustomerSubscription = this.apiService.getCustomer(this.customerId).subscribe({
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
          insuranceId: result.insuranceId,
          insuranceStatus: result.insuranceStatus,
          insuredPersonNumber: result.insuredPersonNumber,
          isCareContractAvailable: result.isCareContractAvailable,
          lastName: result.lastName,
          phone: result.phone,
          salutation: result.salutation,
          street: result.street,
          zipCode: result.zipCode,
          doClearanceReliefAmount: result.doClearanceReliefAmount,
          doClearanceCareBenefit: result.doClearanceCareBenefit,
        });

        this.selectedInsurance = result.insurance;
        this.isLoading = false;
      },
      error: (error) => {
        if (error.status === 404) {
          this.toastr.error('Kunde wurde nicht gefunden');
          this.router.navigate(['/dashboard/customers']);
        } else {
          this.toastr.error(`Kunde konnte nicht geladen werden: [${error.status}] ${error.error}`);
          this.isLoading = false;
        }
      },
    });
  }

  private UpdateCustomer(customer: Customer) {
    this.isSaving = true;
    this.updateCustomerSubscription?.unsubscribe();
    this.updateCustomerSubscription = this.apiService.updateCustomer(customer).subscribe({
      complete: () => {
        this.toastr.success('Änderungen am Kunden wurden gespeichert');
        this.router.navigate(['/dashboard/customers']);
      },
      error: (error) => {
        this.toastr.error(`Fehler beim Speichern der Änderungen: [${error.status}] ${error.error}`);
        this.isSaving = false;
      },
    });
  }

  private onCareLEvelChange(value: any): void {
    // If the care level is set to 0, the insurance status must be self payment
    if (value == 0) {
      this.customerForm.get('insuranceStatus')?.setValue(2);
      this.customerForm.get('insuranceStatus')?.disable();
    } else if (this.isManager) {
      this.customerForm.get('insuranceStatus')?.enable();
    }

    // If the care level is less than 1, the customer can't be cleared through the relief amount
    if (value >= 1) {
      this.customerForm.get('doClearanceReliefAmount')?.enable();
    } else {
      this.customerForm.get('doClearanceReliefAmount')?.setValue(false);
      this.customerForm.get('doClearanceReliefAmount')?.disable();
    }

    // If the care level is less than 2, the customer can't be cleared through the care benefit
    if (value >= 2) {
      this.customerForm.get('doClearanceCareBenefit')?.enable();
    } else {
      this.customerForm.get('doClearanceCareBenefit')?.setValue(false);
      this.customerForm.get('doClearanceCareBenefit')?.disable();
    }
  }
}
