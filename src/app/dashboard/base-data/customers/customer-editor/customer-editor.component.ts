import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { UUID } from 'angular2-uuid';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Observable, OperatorFunction, Subscription, combineLatest, debounceTime, distinctUntilChanged, firstValueFrom, mergeMap } from 'rxjs';
import { InputComponent } from '@curacaru/shared/input/input.component';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { Gender } from '@curacaru/enums/gender.enum';
import { CustomerStatus } from '@curacaru/enums/customer-status.enum';
import { ApiService, ErrorHandlerService, UserService } from '@curacaru/services';
import { Customer, Insurance } from '@curacaru/models';
import { ValidateInsuredPersonNumber } from '@curacaru/validators/insured-person-number.validator';
import { ProductsRepository } from '@curacaru/services/repositories/products.repository';
import { Product } from '@curacaru/models/product';
import { EmployeeSelectComponent } from '@curacaru/shared/employee-select/employee-select.component';

@Component({
  providers: [ApiService],
  selector: 'cura-customer-editor',
  standalone: true,
  styleUrls: ['./customer-editor.component.scss'],
  templateUrl: './customer-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    EmployeeSelectComponent,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    NgxSkeletonLoaderModule,
    NgbTypeaheadModule,
    InputComponent,
    AsyncPipe,
  ],
})
export class CustomerEditorComponent implements OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly toastr = inject(ToastrService);
  private readonly productsRepository = inject(ProductsRepository);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  readonly cityName = signal('');
  readonly customerForm: FormGroup;
  readonly products = signal<Product[]>([]);
  readonly isLoading = signal(false);
  isNew = true;
  readonly isSaving = signal(false);
  readonly isManager = signal(false);
  customerStatus = CustomerStatus;
  isCustomer = signal(true);

  insuranceFormatter = (insurance: Insurance) => insurance.name;

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

  private getZipCodeSubscription?: Subscription;
  private postCustomerSubscription?: Subscription;
  private updateCustomerSubscription?: Subscription;

  get productsGroup() {
    return this.customerForm.get('products') as FormArray;
  }

  constructor() {
    this.customerForm = this.formBuilder.group({
      associatedEmployeeId: [null],
      birthDate: ['', [Validators.required]],
      careLevel: [1, [Validators.required]],
      doClearanceCareBenefit: [false],
      doClearancePreventiveCare: [false],
      doClearanceReliefAmount: [false],
      doClearanceSelfPayment: [false],
      emergencyContactName: ['', [Validators.maxLength(150)]],
      emergencyContactPhone: ['', [Validators.maxLength(50)]],
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      insuranceId: [''],
      insuranceStatus: this.formBuilder.nonNullable.control<InsuranceStatus | null>(null),
      insuredPersonNumber: ['', [Validators.maxLength(10)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      phone: ['', [Validators.maxLength(50)]],
      salutation: this.formBuilder.nonNullable.control<Gender | null>(null, [Validators.required]),
      status: this.formBuilder.control<CustomerStatus | null>(CustomerStatus.Customer),
      street: ['', [Validators.required, Validators.maxLength(150)]],
      zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern('^[0-9]*$')]],
      products: this.formBuilder.array([]),
    });

    this.customerForm.get('careLevel')?.valueChanges.subscribe((value) => this.handleCareLevelChange(value));
    this.customerForm.get('insuredPersonNumber')?.valueChanges.subscribe(() => this.handleInsuranceInfoChange());
    this.customerForm.get('insuranceStatus')?.valueChanges.subscribe(() => this.handleInsuranceInfoChange());

    this.changeZipCodeSubscription = this.customerForm.get('zipCode')?.valueChanges.subscribe((value) => {
      this.handleZipCodeChange(value);
    });

    combineLatest({
      isManager: this.userService.isManager$,
      products: this.productsRepository.getProductsList(),
    }).subscribe({
      next: (result) => {
        this.products.set(result.products);
        this.isManager.set(result.isManager);
        if (!this.isManager()) this.customerForm.disable();

        if (this.router.url.endsWith('new')) {
          this.isNew = true;
          this.handleCareLevelChange(this.customerForm.get('careLevel')?.value);
        } else {
          this.LoadCustomer();
        }
      },
      error: (e) => this.errorHandlerService.handleError(e),
    });
  }

  ngOnDestroy(): void {
    this.changeZipCodeSubscription?.unsubscribe();
    this.getZipCodeSubscription?.unsubscribe();
    this.postCustomerSubscription?.unsubscribe();
    this.updateCustomerSubscription?.unsubscribe();
  }

  // Tries to get the name of the city for the entered zip code
  handleZipCodeChange(zipCode: string) {
    this.cityName.set('');
    if (zipCode.length == 5) {
      this.getZipCodeSubscription?.unsubscribe();
      this.getZipCodeSubscription = this.apiService.getCityName(zipCode).subscribe({
        next: (result) => this.cityName.set(result),
        error: () => {
          this.cityName.set('Unbekannte PLZ');
          this.customerForm.get('zipCode')?.setErrors({ unknownZipCode: true });
        },
      });
    }
  }

  // Function for the typeahead to search for insurances
  searchInsurance: OperatorFunction<string, readonly Insurance[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      mergeMap(async (term) => {
        if (term.length < 2) return [];

        let insurances = await firstValueFrom(this.apiService.getInsuranceByName(term));
        return insurances;
      })
    );

  handleSave(): void {
    // insurance status is required if the customer is not a prospective
    if (this.customerForm.get('status')?.value != CustomerStatus.Interested && this.customerForm.get('insuranceStatus')?.value == null) {
      this.customerForm.get('insuranceStatus')?.setErrors({ required: true });
      this.customerForm.get('insuranceStatus')?.markAsTouched();
    } else {
      this.customerForm.get('insuranceStatus')?.setErrors(null);
    }

    if (!this.customerForm.valid) {
      Object.keys(this.customerForm.controls).forEach((key) => {
        this.customerForm.get(key)?.markAsTouched();
      });
      return;
    }

    const customer: Customer = { ...this.customerForm.getRawValue() };
    customer.id = this.isNew ? undefined : this.customerId;
    customer.products = this.productsGroup.controls.filter((o) => o.value?.isSelected).map((o) => o.value!.id);
    customer.insuranceId = customer.insuranceId === '' ? undefined : customer.insuranceId;
    customer.associatedEmployeeId = customer.associatedEmployeeId === '' ? undefined : customer.associatedEmployeeId;

    this.isNew ? this.CreateCustomer(customer) : this.UpdateCustomer(customer);
  }

  private CreateCustomer(customer: Customer) {
    this.isSaving.set(true);
    this.postCustomerSubscription?.unsubscribe();
    this.postCustomerSubscription = this.apiService.createCustomer(customer).subscribe({
      complete: () => {
        this.toastr.success('Ein neuer Kunde wurde angelegt');
        this.router.navigate(['/dashboard/customers']);
      },
      error: (error) => {
        this.toastr.error(`Kunde konnte nicht angelegt werden: [${error.status}] ${error.error}`);
        this.isSaving.set(false);
      },
    });
  }

  private handleInsuranceInfoChange(): void {
    const isInsuredPersonNumberValid = ValidateInsuredPersonNumber(this.customerForm.controls['insuredPersonNumber']);

    if (isInsuredPersonNumberValid === null || this.customerForm.get('insuranceStatus')?.value != InsuranceStatus.Statutory) {
      this.customerForm.get('insuredPersonNumber')?.setErrors(null);
    } else {
      this.customerForm.get('insuredPersonNumber')?.setErrors(isInsuredPersonNumberValid);
    }
  }

  private LoadCustomer(): void {
    this.isNew = false;
    this.isLoading.set(true);
    this.customerId = this.router.url.split('/').pop() ?? '';
    this.apiService.getCustomer(this.customerId).subscribe({
      next: (result) => {
        this.customerForm.patchValue({
          associatedEmployeeId: result.associatedEmployeeId,
          birthDate: result.birthDate,
          careLevel: result.careLevel,
          doClearanceCareBenefit: result.doClearanceCareBenefit,
          doClearancePreventiveCare: result.doClearancePreventiveCare,
          doClearanceReliefAmount: result.doClearanceReliefAmount,
          doClearanceSelfPayment: result.doClearanceSelfPayment,
          emergencyContactName: result.emergencyContactName,
          emergencyContactPhone: result.emergencyContactPhone,
          firstName: result.firstName,
          id: result.id,
          insuranceId: result.insuranceId,
          insuranceStatus: result.insuranceStatus,
          insuredPersonNumber: result.insuredPersonNumber,
          lastName: result.lastName,
          phone: result.phone,
          salutation: result.salutation,
          status: result.status,
          street: result.street,
          zipCode: result.zipCode,
        });

        this.products().forEach((product) => {
          product.isSelected = result.products.includes(product.id);
          this.productsGroup.push(
            this.formBuilder.group({
              id: new FormControl(product.id),
              name: new FormControl(product.name),
              isSelected: new FormControl(product.isSelected),
            })
          );
        });
        if (!this.isManager()) this.productsGroup.disable();

        this.isCustomer.set(result.status !== CustomerStatus.Interested);

        this.handleCareLevelChange(result.careLevel);
        this.selectedInsurance = result.insurance;
        this.isLoading.set(false);
      },
      error: (error) => {
        if (error.status === 404) {
          this.toastr.error('Kunde wurde nicht gefunden');
          this.isCustomer() ? this.router.navigate(['/dashboard/customers']) : this.router.navigate(['/dashboard/base-data/prospects']);
        } else {
          this.toastr.error(`Kunde konnte nicht geladen werden: [${error.status}] ${error.error}`);
          this.isLoading.set(false);
        }
      },
    });
  }

  private UpdateCustomer(customer: Customer) {
    this.isSaving.set(true);
    this.updateCustomerSubscription?.unsubscribe();
    this.updateCustomerSubscription = this.apiService.updateCustomer(customer).subscribe({
      complete: () => {
        this.toastr.success('Änderungen wurden erfolgreich gespeichert');
        this.isCustomer() ? this.router.navigate(['/dashboard/customers']) : this.router.navigate(['/dashboard/base-data/prospects']);
      },
      error: (error) => {
        this.toastr.error(`Fehler beim Speichern der Änderungen: [${error.status}] ${error.error}`);
        this.isSaving.set(false);
      },
    });
  }

  private handleCareLevelChange(value: any): void {
    if (!this.isManager()) return;

    // If the care level is set to 0, the insurance status must be self payment
    if (value == 0) {
      this.customerForm.get('insuranceStatus')?.setValue(2);
      this.customerForm.get('insuranceStatus')?.disable();
      this.customerForm.get('doClearanceSelfPayment')?.setValue(true);
      this.customerForm.get('doClearanceSelfPayment')?.disable();
    } else if (this.isManager()) {
      this.customerForm.get('insuranceStatus')?.enable();
    }

    // Only managers can edit the customer
    if (this.isManager) {
      // If the care level is less than 1, the customer can't be cleared through the relief amount
      if (value >= 1) {
        this.customerForm.get('doClearanceReliefAmount')?.enable();
        this.customerForm.get('doClearanceSelfPayment')?.enable();
      } else if (this.isManager()) {
        this.customerForm.get('doClearanceReliefAmount')?.setValue(false);
        this.customerForm.get('doClearanceReliefAmount')?.disable();
      }

      // If the care level is less than 2, the customer can't be cleared through the care benefit or preventive care
      if (value >= 2) {
        this.customerForm.get('doClearanceCareBenefit')?.enable();
        this.customerForm.get('doClearancePreventiveCare')?.enable();
      } else {
        this.customerForm.get('doClearanceCareBenefit')?.setValue(false);
        this.customerForm.get('doClearanceCareBenefit')?.disable();
        this.customerForm.get('doClearancePreventiveCare')?.setValue(false);
        this.customerForm.get('doClearancePreventiveCare')?.disable();
      }
    }
  }
}
