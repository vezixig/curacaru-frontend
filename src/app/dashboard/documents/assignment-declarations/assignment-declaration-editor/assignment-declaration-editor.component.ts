import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { Customer, UserEmployee } from '@curacaru/models';
import { FallbackSpacePipe } from '@curacaru/pipes/fallback-space.pipe';
import { ApiService, ErrorHandlingService, UserService } from '@curacaru/services';
import { DocumentRepository } from '@curacaru/services/repositories/document.repository';
import { SignatureComponent } from '@curacaru/shared/signature/signature.component';
import { ValidateTrue } from '@curacaru/validators/true.validator';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbDatepickerModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, catchError, combineLatest, map, mergeMap, tap } from 'rxjs';
import { MonthNamePipe } from '@curacaru/pipes/month-name.pipe';
import { InfoComponent } from '@curacaru/shared/info-box/info.component';

@Component({
  selector: 'cura-assignment-declaration-editor',
  standalone: true,
  templateUrl: './assignment-declaration-editor.component.html',
  imports: [
    AsyncPipe,
    CommonModule,
    FallbackSpacePipe,
    FontAwesomeModule,
    InfoComponent,
    MonthNamePipe,
    NgbDatepickerModule,
    ReactiveFormsModule,
    RouterModule,
    SignatureComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentDeclarationEditorComponent {
  insuranceStatus = InsuranceStatus;

  readonly documentForm: FormGroup;
  readonly isSaving = signal(false);
  readonly dataModel$: Observable<{
    customer: Customer;
    user: UserEmployee;
  }>;
  readonly today: Date = new Date();

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly documentRepository = inject(DocumentRepository);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toasterService = inject(ToastrService);
  private readonly userService = inject(UserService);
  private readonly offCanvasService = inject(NgbOffcanvas);
  private readonly errorHandlingService = inject(ErrorHandlingService);

  constructor() {
    this.documentForm = this.formBuilder.group({
      customerId: [undefined, [Validators.required]],
      isAccepted: [false, [ValidateTrue]],
      signature: [undefined],
      signatureCity: [undefined, [Validators.required, Validators.maxLength(30)]],
      year: [undefined, [Validators.required]],
    });

    this.dataModel$ = combineLatest({ user: this.userService.user$, queryParams: this.activatedRoute.queryParams }).pipe(
      tap((o) => {
        this.documentForm.controls['year'].setValue(+o.queryParams['year'] || this.today.getFullYear());
        this.documentForm.controls['customerId'].setValue(o.queryParams['customer']);
      }),
      mergeMap((o) => {
        return this.apiService.getCustomer(o.queryParams['customer']).pipe(map((customer) => ({ customer, user: o.user })));
      }),
      catchError((error) => {
        this.errorHandlingService.handleError(error);
        return [];
      })
    );
  }

  onStartSigning(template: TemplateRef<any>) {
    this.offCanvasService.open(template, { position: 'bottom', panelClass: 'signature-panel' });
  }

  onSigned($event: string) {
    this.documentForm.controls['signature'].setValue($event);
    this.save();
  }

  private save() {
    this.isSaving.set(true);
    this.documentRepository.createAssignmentDeclaration(this.documentForm.value).subscribe({
      next: (_) => {
        this.toasterService.success('Abtretungserklärung erfolgreich gespeichert');
        this.router.navigate(['/dashboard/documents/assignment-declarations']);
      },
      error: (error) => {
        this.toasterService.error(`Abtretungserklärung konnte nicht erstellt werden: [${error.status}] ${error.error}`);
        this.isSaving.set(false);
      },
    });
  }
}
