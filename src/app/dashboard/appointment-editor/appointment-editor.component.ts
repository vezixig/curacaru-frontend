import { CommonModule, Time } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Employee } from '../../models/employee.model';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, OperatorFunction, Subscription, debounceTime, distinctUntilChanged, first, firstValueFrom, map, mergeMap } from 'rxjs';
import { Customer } from '../../models/customer.model';
import { UUID } from 'angular2-uuid';
import { NgbDate, NgbDateParserFormatter, NgbDatepicker, NgbDatepickerModule, NgbTimepickerModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { Insurance } from '../../models/insurance.model';
import { EmployeeBasic as EmployeeBase } from '../../models/employee-basic.model';
import { CustomerListEntry } from '../../models/customer-list-entry.model';
import { GermanDateParserFormatter } from '../../i18n/date-formatter';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Appointment } from '../../models/appointment.model';
import { DateTimeService } from '../../services/date-time.service';

@Component({
  imports: [CommonModule, FontAwesomeModule, FormsModule, NgbDatepickerModule, NgbTimepickerModule, RouterModule, ReactiveFormsModule, NgbTypeaheadModule],
  selector: 'cura-appointment-editor',
  providers: [{ provide: NgbDateParserFormatter, useClass: GermanDateParserFormatter }],
  standalone: true,
  templateUrl: './appointment-editor.component.html',
})
export class AppointmentEditorComponent implements OnInit, OnDestroy {
  //       },
  //       error: (error) => {
  //         this.toastr.error('Kunde konnte nicht angelegt werden: ' + error.message);
  //       },
  //     });
  // }
  // private LoadCustomer(): void {
  //   this.isNew = false;
  //   this._customerId = this.router.url.split('/').pop() ?? '';
  //   this.httpClient
  //     .get<Customer>(`https://localhost:7077/customer/${this._customerId}`)
  //     .pipe(first())
  //     .subscribe({
  //       next: (result) => {
  //         this.customerForm.patchValue({
  //           associatedEmployeeId: result.associatedEmployeeId,
  //           birthDate: result.birthDate,
  //           careLevel: result.careLevel,
  //           declarationsOfAssignment: result.declarationsOfAssignment,
  //           emergencyContactName: result.emergencyContactName,
  //           emergencyContactPhone: result.emergencyContactPhone,
  //           firstName: result.firstName,
  //           id: result.id,
  //           insuranceId: result.insuranceId,
  //           insuranceStatus: result.insuranceStatus,
  //           insuredPersonNumber: result.insuredPersonNumber,
  //           isCareContractAvailable: result.isCareContractAvailable,
  //           lastName: result.lastName,
  //           phone: result.phone,
  //           street: result.street,
  //           zipCode: result.zipCode,
  //         });
  //         this.selectedInsurance = result.insurance;
  //       },
  //       error: (error) => {
  //         this.toastr.error('Mitarbeiter konnte nicht geladen werden: ' + error.message);
  //       },
  //     });
  // }
  // private UpdateCustomer(customer: Customer) {
  //   this._updateCustomerSubscription = this.httpClient.put<Customer>('https://localhost:7077/customer', customer).subscribe({
  //     complete: () => {
  //       this.toastr.success('Änderungen am Kunden wurden gespeichert');
  //       this.router.navigate(['/dashboard/customer']);
  //     },
  //     error: (error) => {
  //       this.toastr.error('Fehler beim Speichern der Änderungen: ' + error.message);
  //     },
  //   });
  // }

  faCalendar = faCalendar;

  appointmentForm: FormGroup;
  employees: EmployeeBase[] = [];
  customers: CustomerListEntry[] = [];

  isNew: boolean = true;

  private _getEmployeeListSubscription?: Subscription;
  private _getCustomerListSubscription?: Subscription;
  private _postAppointmentSubscription?: Subscription;

  constructor(private formBuilder: FormBuilder, private httpClient: HttpClient, private router: Router, private toastr: ToastrService) {
    this.appointmentForm = this.formBuilder.group({
      isSignedByEmployee: [false],
      isSignedByCustomer: [false],
      notes: [''],
      date: ['', [Validators.required]],
      timeStart: ['', [Validators.required]],
      timeEnd: ['', [Validators.required]],
      customerId: ['', [Validators.required]],
      employeeId: ['', [Validators.required]],
      employeeReplacementId: [''],
    });

    this.appointmentForm.get('customerId')?.valueChanges.subscribe((value) => this.onCustomerChanged(value));

    this._getEmployeeListSubscription = this.httpClient
      .get<EmployeeBase[]>('https://localhost:7077/employee/baselist')
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.employees = result;
        },
        error: (error) => {
          this.toastr.error('Mitarbeiterliste konnte nicht abgerufen werden: ' + error.message);
        },
      });

    this._getCustomerListSubscription = this.httpClient
      .get<CustomerListEntry[]>('https://localhost:7077/customer/list')
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.customers = result;
        },
        error: (error) => {
          this.toastr.error('Kundenliste konnte nicht abgerufen werden: ' + error.message);
        },
      });
  }

  ngOnDestroy(): void {
    this._getEmployeeListSubscription?.unsubscribe();
    this._getCustomerListSubscription?.unsubscribe();
    this._postAppointmentSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    if (this.router.url.endsWith('new')) {
      this.isNew = true;
    } else {
      // this.LoadCustomer();
    }
  }

  onSave(): void {
    const appointment: Appointment = {
      employeeId: this.appointmentForm.get('employeeId')?.value,
      employeeReplacementId: this.appointmentForm.get('employeeReplacementId')?.value,
      customerId: this.appointmentForm.get('customerId')?.value,
      date: this.appointmentForm.get('date')?.value,
      timeStart: DateTimeService.toTime(this.appointmentForm.get('timeStart')?.value),
      timeEnd: DateTimeService.toTime(this.appointmentForm.get('timeEnd')?.value),
      isSignedByEmployee: this.appointmentForm.get('isSignedByEmployee')?.value,
      isSignedByCustomer: this.appointmentForm.get('isSignedByCustomer')?.value,
      notes: this.appointmentForm.get('notes')?.value,
      isDone: false,
    };
    appointment.employeeReplacementId = appointment.employeeReplacementId == '' ? undefined : appointment.employeeReplacementId;

    if (appointment.timeStart.hours * 60 + appointment.timeStart.minutes > appointment.timeEnd.hours * 60 + appointment.timeEnd.minutes) {
      this.toastr.warning('Startzeit muss vor Endzeit liegen');
      return;
    }

    this.isNew ? this.CreateAppointment(appointment) : this.UpdateAppointment(appointment);
  }

  toggleIsSignedByCustomer() {
    this.appointmentForm.get('isSignedByCustomer')?.setValue(!this.appointmentForm.get('isSignedByCustomer')?.value);
  }

  toggleIsSignedByEmployee() {
    this.appointmentForm.get('isSignedByEmployee')?.setValue(!this.appointmentForm.get('isSignedByEmployee')?.value);
  }

  // // Tries to get the name of the city for the entered zip code
  // handleZipCodeChange(zipCode: string) {
  //   this.CityName = '';
  //   if (zipCode.length == 5) {
  //     this._getZipCodeSubscription?.unsubscribe();

  //     this._getZipCodeSubscription = this.httpClient
  //       .get(`https://localhost:7077/address/city/${zipCode}`, { responseType: 'text' })
  //       .pipe(first())
  //       .subscribe({
  //         next: (result) => {
  //           this.CityName = result;
  //         },
  //         error: (error) => {
  //           this.CityName = 'Unbekannte PLZ';
  //         },
  //       });
  //   }
  // }

  // // Function for the typeahead to search for insurances
  // search: OperatorFunction<string, readonly Insurance[]> = (text$: Observable<string>) =>
  //   text$.pipe(
  //     debounceTime(200),
  //     distinctUntilChanged(),
  //     mergeMap(async (term) => {
  //       if (term.length < 2) return [];

  //       let insurances = await firstValueFrom(this.httpClient.get<Insurance[]>(`https://localhost:7077/insurance?search=${term}`));
  //       return insurances;
  //     })
  //   );

  // handleAddDeclarationOfAssignment(event: Event | undefined = undefined) {
  //   event?.preventDefault();
  //   if (this.newDeclarationOfAssignment != null && this.newDeclarationOfAssignment >= 2000 && this.newDeclarationOfAssignment < 9999 && !this.customerForm.get('declarationsOfAssignment')?.value.includes(this.newDeclarationOfAssignment)) {
  //     this.customerForm.get('declarationsOfAssignment')?.value.push(this.newDeclarationOfAssignment);
  //     this.newDeclarationOfAssignment = null;
  //   }
  // }

  // handleRemoveDeclarationOfAssignment(year: number) {
  //   this.customerForm.get('declarationsOfAssignment')?.value.splice(this.customerForm.get('declarationsOfAssignment')?.value.indexOf(year), 1);
  // }

  private CreateAppointment(appointment: Appointment) {
    console.log(appointment.date instanceof Date);

    const customSerializer = (key: string, value: any) => {
      if (typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
        return DateTimeService.toDateString(value);
      }
      if (typeof value === 'object' && 'hours' in value && 'minutes' in value) {
        return DateTimeService.toTimeString(value);
      }
      return value;
    };

    const serializedData = JSON.stringify(appointment, customSerializer);
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this._postAppointmentSubscription = this.httpClient
      .post('https://localhost:7077/appointment/new', serializedData, { headers: headers })
      .pipe(first())
      .subscribe({
        complete: () => {
          this.toastr.success('Ein neuer Termin wurde angelegt');
          this.router.navigate(['/dashboard/appointment']);
        },
        error: (error) => {
          this.toastr.error('Termin konnte nicht angelegt werden: ' + error.message);
        },
      });
  }

  // private LoadCustomer(): void {
  //   this.isNew = false;
  //   this._customerId = this.router.url.split('/').pop() ?? '';
  //   this.httpClient
  //     .get<Customer>(`https://localhost:7077/customer/${this._customerId}`)
  //     .pipe(first())
  //     .subscribe({
  //       next: (result) => {
  //         this.customerForm.patchValue({
  //           associatedEmployeeId: result.associatedEmployeeId,
  //           birthDate: result.birthDate,
  //           careLevel: result.careLevel,
  //           declarationsOfAssignment: result.declarationsOfAssignment,
  //           emergencyContactName: result.emergencyContactName,
  //           emergencyContactPhone: result.emergencyContactPhone,
  //           firstName: result.firstName,
  //           id: result.id,
  //           insuranceId: result.insuranceId,
  //           insuranceStatus: result.insuranceStatus,
  //           insuredPersonNumber: result.insuredPersonNumber,
  //           isCareContractAvailable: result.isCareContractAvailable,
  //           lastName: result.lastName,
  //           phone: result.phone,
  //           street: result.street,
  //           zipCode: result.zipCode,
  //         });

  //         this.selectedInsurance = result.insurance;
  //       },
  //       error: (error) => {
  //         this.toastr.error('Mitarbeiter konnte nicht geladen werden: ' + error.message);
  //       },
  //     });
  // }

  private UpdateAppointment(appointment: Appointment) {
    // this._updateCustomerSubscription = this.httpClient.put<Customer>('https://localhost:7077/customer', customer).subscribe({
    //   complete: () => {
    //     this.toastr.success('Änderungen am Kunden wurden gespeichert');
    //     this.router.navigate(['/dashboard/customer']);
    //   },
    //   error: (error) => {
    //     this.toastr.error('Fehler beim Speichern der Änderungen: ' + error.message);
    //   },
    // });
  }

  private onCustomerChanged(customerId: number): void {
    const employeeId = this.customers.find((e) => e.id === customerId)?.associatedEmployeeId ?? null;
    this.appointmentForm.get('employeeId')?.setValue(employeeId);
  }
}
