import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Subscription, first } from 'rxjs';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ApiService } from '../../services/api.service';
import { UUID } from 'angular2-uuid';
import { Employee } from '../../models/employee.model';
import { ValidateInstitutionCode } from '../../validators/institution-code.validator';
import { ValidateCurrency } from '../../validators/currency-validator';
import { Company } from '../../models/company.model';

@Component({
  imports: [CommonModule, NgxSkeletonLoaderModule, RouterModule, ReactiveFormsModule],
  selector: 'cura-company',
  providers: [ApiService],
  standalone: true,
  templateUrl: './company.component.html',
})
export class CompanyComponent implements OnDestroy, OnInit {
  companyForm: FormGroup;
  isLoading = false;
  isSaving = false;
  cityName = '';

  private createEmployeeSubscription: Subscription | undefined = undefined;
  private getCompanySubscription?: Subscription;
  private updateEmployeeSubscription?: Subscription;
  private getZipCodeSubscription?: Subscription;
  private changeZipCodeSubscription?: Subscription;
  private changePricePerHourSubscription?: Subscription;

  constructor(private apiService: ApiService, private formBuilder: FormBuilder, private router: Router, private toastr: ToastrService) {
    this.companyForm = this.formBuilder.group({
      name: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(150)]],
      ownerName: ['', [Validators.maxLength(150)]],
      street: ['', [Validators.required, Validators.maxLength(150)]],
      zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5), Validators.pattern('^[0-9]*$')]],
      serviceId: ['', [Validators.required, Validators.maxLength(150)]],
      recognitionDate: ['', [Validators.required]],
      institutionCode: ['', [Validators.required, ValidateInstitutionCode]],
      taxNumber: ['', [Validators.required]],
      iban: ['', [Validators.required]],
      bic: ['', [Validators.required]],
      pricePerHour: ['', [Validators.required, ValidateCurrency]],
      employeeSalary: ['', [Validators.required, ValidateCurrency]],
      rideCosts: ['', [Validators.required, ValidateCurrency]],
      rideCostsType: ['', [Validators.required]],
    });

    this.changePricePerHourSubscription = this.companyForm.get('rideCostsType')?.valueChanges.subscribe((value) => {
      if (+value === 0) {
        this.companyForm.get('rideCosts')?.setValue('');
        this.companyForm.get('rideCosts')?.disable();
      } else {
        this.companyForm.get('rideCosts')?.enable();
      }
    });

    this.changeZipCodeSubscription = this.companyForm.get('zipCode')?.valueChanges.subscribe((value) => {
      this.handleZipCodeChange(value);
    });
  }

  ngOnInit(): void {
    this.LoadCompany();
  }

  ngOnDestroy(): void {
    this.changePricePerHourSubscription?.unsubscribe();
    this.createEmployeeSubscription?.unsubscribe();
    this.getCompanySubscription?.unsubscribe();
    this.updateEmployeeSubscription?.unsubscribe();
    this.changeZipCodeSubscription?.unsubscribe();
    this.getZipCodeSubscription?.unsubscribe();
  }

  // Tries to get the name of the city for the entered zip code
  handleZipCodeChange(zipCode: string) {
    this.cityName = '';
    if (zipCode.length == 5) {
      this.getZipCodeSubscription?.unsubscribe();
      this.getZipCodeSubscription = this.apiService.getCityName(zipCode).subscribe({
        next: (result) => (this.cityName = result),
        error: (_) => {
          this.cityName = 'Unbekannte PLZ';
          this.companyForm.get('zipCode')?.setErrors({ unknownZipCode: true });
        },
      });
    }
  }

  handleSave(): void {
    const company: Company = {
      name: this.companyForm.get('name')?.value,
      ownerName: this.companyForm.get('ownerName')?.value,
      street: this.companyForm.get('street')?.value,
      zipCode: this.companyForm.get('zipCode')?.value,
      serviceId: this.companyForm.get('serviceId')?.value,
      recognitionDate: this.companyForm.get('recognitionDate')?.value,
      institutionCode: this.companyForm.get('institutionCode')?.value,
      taxNumber: this.companyForm.get('taxNumber')?.value,
      iban: this.companyForm.get('iban')?.value,
      bic: this.companyForm.get('bic')?.value,
      pricePerHour: this.companyForm.get('pricePerHour')?.value,
      employeeSalary: this.companyForm.get('employeeSalary')?.value,
      rideCosts: +this.companyForm.get('rideCosts')?.value,
      rideCostsType: +this.companyForm.get('rideCostsType')?.value,
    };

    this.isSaving = true;
    this.updateEmployeeSubscription?.unsubscribe();
    this.updateEmployeeSubscription = this.apiService.updateCompany(company).subscribe({
      complete: () => {
        this.toastr.success('Änderungen am Unternehmen wurden gespeichert');
        this.LoadCompany();
        this.isSaving = false;
      },
      error: (error) => {
        this.toastr.error(`Fehler beim Speichern der Änderungen: [${error.status}] ${error.error}`);
        this.isSaving = false;
      },
    });
  }

  private LoadCompany(): void {
    this.isLoading = true;
    this.getCompanySubscription = this.apiService.getCompany().subscribe({
      next: (result) => {
        this.companyForm.patchValue({
          name: result.name,
          ownerName: result.ownerName,
          street: result.street,
          zipCode: result.zipCode,
          serviceId: result.serviceId,
          recognitionDate: result.recognitionDate,
          institutionCode: result.institutionCode,
          taxNumber: result.taxNumber,
          iban: result.iban,
          bic: result.bic,
          pricePerHour: result.pricePerHour,
          employeeSalary: result.employeeSalary,
          rideCosts: result.rideCosts,
          rideCostsType: result.rideCostsType,
        });

        this.isLoading = false;
      },
      error: (error) => {
        if (error.status === 404) {
          this.toastr.error('Mitarbeiter wurde nicht gefunden');
          this.router.navigate(['/dashboard/employees']);
        } else {
          this.toastr.error(`Mitarbeiter konnte nicht geladen werden: [${error.status}] ${error.error}`);
          this.isLoading = false;
        }
      },
    });
  }
}
