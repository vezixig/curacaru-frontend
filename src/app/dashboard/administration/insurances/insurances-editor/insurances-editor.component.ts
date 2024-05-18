import { Component, OnDestroy, OnInit } from '@angular/core';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UUID } from 'angular2-uuid';

import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ApiService } from '../../../services/api.service';
import { Insurance } from '../../../models/insurance.model';
import { ValidateInstitutionCode } from '../../../validators/institution-code.validator';

@Component({
  imports: [CommonModule, FontAwesomeModule, FormsModule, NgxSkeletonLoaderModule, RouterModule, ReactiveFormsModule],
  selector: 'cura-insurances-editor',
  providers: [ApiService],
  standalone: true,
  templateUrl: './insurances-editor.component.html',
})
export class InsurancesEditorComponent implements OnInit, OnDestroy {
  faCalendar = faCalendar;

  insuranceForm: FormGroup;
  isLoading: boolean = false;
  isNew: boolean = true;
  isSaving: boolean = false;
  cityName = '';

  private insuranceId?: UUID;
  private getInsuranceSubscription?: Subscription;
  private postInsuranceSubscription?: Subscription;
  private updateInsuranceSubscription?: Subscription;
  private changeZipCodeSubscription?: Subscription;
  private getZipCodeSubscription?: Subscription;

  constructor(private apiService: ApiService, private formBuilder: FormBuilder, private router: Router, private toastr: ToastrService) {
    this.insuranceForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      institutionCode: ['', [ValidateInstitutionCode]],
      street: ['', [Validators.maxLength(150)]],
      zipCode: [''],
    });

    this.changeZipCodeSubscription = this.insuranceForm.get('zipCode')?.valueChanges.subscribe((value) => {
      this.handleZipCodeChange(value);
    });
  }

  ngOnDestroy() {
    this.getInsuranceSubscription?.unsubscribe();
    this.postInsuranceSubscription?.unsubscribe();
    this.updateInsuranceSubscription?.unsubscribe();
    this.changeZipCodeSubscription?.unsubscribe();
  }

  ngOnInit() {
    if (this.router.url.endsWith('new')) {
      this.isNew = true;
    } else {
      this.loadAppointment();
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
          this.insuranceForm.get('zipCode')?.setErrors({ unknownZipCode: true });
        },
      });
    } else {
      this.insuranceForm.get('zipCode')?.setErrors({ invalidZipCode: true });
    }
  }

  loadAppointment() {
    this.isLoading = true;
    this.isNew = false;
    this.insuranceId = this.router.url.split('/').pop() ?? '';
    this.getInsuranceSubscription = this.apiService.getInsurance(this.insuranceId).subscribe({
      next: (result) => {
        this.insuranceForm.patchValue({
          name: result.name,
          institutionCode: result.institutionCode,
          street: result.street,
          zipCode: result.zipCode,
        });
        this.isLoading = false;
      },
      error: (error) => {
        if (error.status === 404) {
          this.toastr.error('Versicherung wurde nicht gefunden');
          this.router.navigate(['/dashboard/insurances']);
        } else {
          this.toastr.error(`Versicherung konnte nicht geladen werden: [${error.status}] ${error.error}`);
          this.isLoading = false;
        }
      },
    });
  }

  onSave() {
    const insurance: Insurance = {
      id: this.insuranceId,
      name: this.insuranceForm.value.name,
      street: this.insuranceForm.value.street,
      zipCode: this.insuranceForm.value.zipCode,
      city: '',
      institutionCode: this.insuranceForm.value.institutionCode,
    };

    this.isNew ? this.CreateInsurance(insurance) : this.UpdateInsurance(insurance);
  }

  private CreateInsurance(insurance: Insurance) {
    this.isSaving = true;
    this.postInsuranceSubscription?.unsubscribe();
    this.postInsuranceSubscription = this.apiService.createInsurance(insurance).subscribe({
      complete: () => {
        this.toastr.success('Eine neue Versicherung wurde angelegt');
        this.router.navigate(['/dashboard/insurances']);
      },
      error: (error) => {
        this.toastr.error(`Versicherung konnte nicht angelegt werden: [${error.status}] ${error.error}`);
        this.isSaving = false;
      },
    });
  }

  private UpdateInsurance(insurance: Insurance) {
    this.isSaving = true;
    this.updateInsuranceSubscription?.unsubscribe();
    this.updateInsuranceSubscription = this.apiService.updateInsurance(insurance).subscribe({
      complete: () => {
        this.toastr.success('Änderungen wurden gespeichert');
        this.router.navigate(['/dashboard/insurances']);
      },
      error: (error) => {
        this.toastr.error(`Fehler beim Speichern der Änderungen: [${error.status}] ${error.error}`);
        this.isSaving = false;
      },
    });
  }
}
