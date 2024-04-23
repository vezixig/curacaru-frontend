import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { UUID } from 'angular2-uuid';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Observable, OperatorFunction, Subscription, debounceTime, distinctUntilChanged, firstValueFrom, mergeMap } from 'rxjs';
import { Customer } from '../../../models/customer.model';
import { Insurance } from '../../../models/insurance.model';
import { ApiService } from '../../../services/api.service';
import { EmployeeBasic } from '../../../models/employee-basic.model';
import { ValidateInsuredPersonNumber as ValidateInsuredPersonNumber } from '../../../validators/insured-person-number.validator';
import { UserService } from '../../../services/user.service';
import { InputComponent } from '@curacaru/shared/input/input.component';

@Component({
  providers: [ApiService],
  selector: 'cura-customer-editor',
  standalone: true,
  styleUrls: ['./customer-editor.component.scss'],
  templateUrl: './customer-editor.component.html',
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule, NgxSkeletonLoaderModule, NgbTypeaheadModule, InputComponent, AsyncPipe],
})
export class CustomerEditorComponent implements OnInit, OnDestroy {
  cityName = '';
  customerForm: FormGroup;
  employees: EmployeeBasic[] = [];
  isLoading = false;
  isNew = true;
  isSaving = false;
  isManager$ = this.userService.isManager$;
  isManager: boolean = false;

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
  private getCustomerSubscription?: Subscription;
  private getEmployeeListSubscription?: Subscription;
  private getZipCodeSubscription?: Subscription;
  private postCustomerSubscription?: Subscription;
  private updateCustomerSubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private router: Router,
    private userService: UserService,
    private toastr: ToastrService
  ) {
    this.customerForm = this.formBuilder.group({
      associatedEmployeeId: [null],
      birthDate: ['', [Validators.required]],
      careLevel: [1, [Validators.required]],
      doClearanceCareBenefit: [false],
      doClearancePreventiveCare: [false],
      doClearanceReliefAmount: [false],
      doClearanceSelfPayment: [false],
      emergencyContactName: [''],
      emergencyContactPhone: [''],
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      insuranceId: [''],
      insuranceStatus: this.formBuilder.control<number | null>(null, [Validators.required]),
      insuredPersonNumber: ['', [ValidateInsuredPersonNumber]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      phone: [''],
      salutation: [0],
      street: ['', [Validators.required, Validators.maxLength(150)]],
      zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern('^[0-9]*$')]],
    });

    this.customerForm.get('careLevel')?.valueChanges.subscribe((value) => this.onCareLEvelChange(value));

    this.isManager$.subscribe((value) => {
      if (!value) {
        this.isManager = false;
        this.customerForm.disable();
      } else {
        this.isManager = true;
      }
    });

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
      this.onCareLEvelChange(this.customerForm.get('careLevel')?.value);
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

  handleSave(): void {
    const customer: Customer = { ...this.customerForm.value };
    customer.insuranceStatus = customer.insuranceStatus ? +customer.insuranceStatus : undefined;
    customer.salutation = +customer.salutation;
    customer.id = this.isNew ? undefined : this.customerId;
    customer.insuranceId = customer.insuranceId === '' ? undefined : customer.insuranceId;
    customer.associatedEmployeeId = customer.associatedEmployeeId === '' ? undefined : customer.associatedEmployeeId;

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
          street: result.street,
          zipCode: result.zipCode,
        });

        this.onCareLEvelChange(result.careLevel);
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
      this.customerForm.get('doClearanceSelfPayment')?.setValue(true);
      this.customerForm.get('doClearanceSelfPayment')?.disable();
    } else if (this.isManager) {
      this.customerForm.get('insuranceStatus')?.enable();
    }

    // Only managers can edit the customer
    if (this.isManager) {
      // If the care level is less than 1, the customer can't be cleared through the relief amount
      if (value >= 1) {
        this.customerForm.get('doClearanceReliefAmount')?.enable();
        this.customerForm.get('doClearanceSelfPayment')?.enable();
      } else if (this.isManager) {
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
