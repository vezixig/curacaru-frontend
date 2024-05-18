import { CommonModule } from '@angular/common';
import { Component, TemplateRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClearanceType } from '@curacaru/enums/clearance-type';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { Customer, MinimalCustomerListEntry, UserEmployee } from '@curacaru/models';
import { DeploymentReportTime } from '@curacaru/models/deployment-report-time.model';
import { DeploymentReport } from '@curacaru/models/deployment-report-view.model';
import { TimeFormatPipe } from '@curacaru/pipes/time.pipe';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { DocumentRepository } from '@curacaru/services/repositories/document.repository';
import { InfoComponent } from '@curacaru/shared/info-box/info.component';
import { SignatureComponent } from '@curacaru/shared/signature/signature.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faGear, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { UUID } from 'angular2-uuid';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, combineLatest, debounceTime, filter, forkJoin, map, mergeMap, startWith, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'deployment-report-signature',
  imports: [ReactiveFormsModule, InfoComponent, CommonModule, TimeFormatPipe, FontAwesomeModule, SignatureComponent, RouterModule],
  standalone: true,
  templateUrl: './deployment-report-editor.component.html',
  styleUrls: ['./deployment-report-editor.component.scss'],
})
export class DeploymentReportEditorComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly documentRepository = inject(DocumentRepository);
  private readonly offcanvasService = inject(NgbOffcanvas);
  private readonly router = inject(Router);
  private readonly toastrService = inject(ToastrService);
  private readonly modalService = inject(NgbModal);

  private readonly destroy$ = new Subject<void>();
  private readonly $onRefresh = new Subject();

  months = DateTimeService.months;
  today = DateTimeService.today;
  faCheck = faCheck;
  faTrashCan = faTrashCan;
  faGear = faGear;

  readonly dataModel$: Observable<{
    document?: DeploymentReport;
    customer: Customer;
    user: UserEmployee;
  }>;

  readonly documentForm: FormGroup;
  readonly filterModel$: Observable<{
    customers: MinimalCustomerListEntry[];
  }>;

  constructor() {
    this.documentForm = this.formBuilder.group({
      customerId: ['', Validators.required],
      clearanceType: [ClearanceType.selfPayment, Validators.required],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2999)]],
      month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      signatureEmployee: ['', [Validators.required]],
      signatureCustomer: ['', [Validators.required]],
      signatureCity: ['', [Validators.required, Validators.maxLength(30)]],
    });

    this.documentForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() =>
      this.router.navigate([], {
        queryParams: {
          year: this.documentForm.controls['year'].value,
          month: this.documentForm.controls['month'].value,
          customerId: !this.documentForm.controls['customerId'].value ? undefined : this.documentForm.controls['customerId'].value,
          clearanceType: this.documentForm.controls['clearanceType'].value,
        },
        queryParamsHandling: 'merge',
      })
    );

    this.filterModel$ = this.apiService.getMinimalCustomerListDeploymentReports().pipe(map((customers) => ({ customers })));

    this.dataModel$ = combineLatest({
      filter: this.filterModel$,
      queryParams: this.activatedRoute.queryParams,
      user: this.userService.user$,
      update: this.$onRefresh.pipe(startWith({})),
    }).pipe(
      tap((next) => {
        this.documentForm.controls['year'].setValue(next.queryParams['year'] || new Date().getFullYear(), { emitEvent: false });
        this.documentForm.controls['month'].setValue(next.queryParams['month'] || new Date().getMonth() + 1, { emitEvent: false });
        this.documentForm.controls['customerId'].setValue(next.queryParams['customerId'], { emitEvent: false });
        if (next.queryParams['clearanceType']) {
          this.documentForm.controls['clearanceType'].setValue(next.queryParams['clearanceType'], { emitEvent: false });
        }
      }),
      filter((next) => next.queryParams['customerId'] != undefined),
      debounceTime(300),
      mergeMap((next) =>
        forkJoin({
          customer: this.apiService.getCustomer(next.queryParams['customerId']).pipe(),
          document: this.documentRepository.getDeploymentReport(
            this.documentForm.controls['year'].value,
            this.documentForm.controls['month'].value,
            this.documentForm.controls['customerId'].value,
            this.documentForm.controls['clearanceType'].value
          ),
        }).pipe(map((result) => ({ ...result, user: next.user })))
      )
    );
  }

  openOffCanvas(template: TemplateRef<any>) {
    this.offcanvasService.open(template, { position: 'bottom', panelClass: 'signature-panel' });
  }

  onDeleteAppointment(appointment: DeploymentReportTime) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => {
      this.deleteAppointment(appointment.appointmentId);
    });
    modalRef.componentInstance.title = 'Termin löschen';

    const date = DateTimeService.toLocalDateString(DateTimeService.toDate(appointment.date));
    const start = DateTimeService.toTimeString(appointment.start, false);
    const end = DateTimeService.toTimeString(appointment.end, false);
    modalRef.componentInstance.text = `Soll der Termin am ${date} von ${start}-${end} wirklich gelöscht werden?`;
  }

  private deleteAppointment(appointmentId: UUID) {
    this.apiService.deleteAppointment(appointmentId).subscribe({
      complete: () => {
        this.toastrService.success(`Der Termin wurde gelöscht.`);
        this.$onRefresh.next(true);
      },
      error: (error) => {
        this.toastrService.error(`Termin konnte nicht gelöscht werden: [${error.status}] ${error.error}`);
      },
    });
  }

  onSave() {
    if (this.documentForm.invalid) {
      return;
    }

    this.documentRepository.saveDeploymentReport(this.documentForm.value).subscribe({
      next: () =>
        this.router.navigate(['dashboard', 'documents', 'deployment-reports'], {
          queryParams: { year: this.documentForm.value['year'], month: this.documentForm.value['month'] },
        }),
      error: (error) => {
        this.toastrService.error(`Der Einsatznachweis konnte nicht gespeichert werden [${error.status}] ${error.error}`);
      },
    });
  }

  onEmployeeSigned($event: string) {
    this.documentForm.controls['signatureEmployee'].setValue($event);
    this.offcanvasService.dismiss();
  }

  onCustomerSigned($event: string) {
    this.documentForm.controls['signatureCustomer'].setValue($event);
    this.offcanvasService.dismiss();
  }
}
