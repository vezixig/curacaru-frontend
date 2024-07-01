import { Budget } from '@curacaru/models/budget.model';
import { BudgetService } from '@curacaru/services/budget.service';
import { BudgetUpdate } from '@curacaru/models/BudgetUpdate';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ApiService, DateTimeService } from '@curacaru/services';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '@curacaru/shared/input/input.component';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Router, RouterModule } from '@angular/router';
import { StringCurrencyPipe } from '@curacaru/pipes/string-currency.pipe';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UUID } from 'angular2-uuid';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RideCostsType } from '@curacaru/enums/ride-cost-type.enum';

@Component({
  imports: [ReactiveFormsModule, FormsModule, FontAwesomeModule, RouterModule, InputComponent, NgbAccordionModule, NgxSkeletonLoaderModule],
  providers: [BudgetService, StringCurrencyPipe, DecimalPipe],
  selector: 'cura-budget-editor',
  standalone: true,
  templateUrl: './budgets-editor.component.html',
})
export class BudgetsEditorComponent implements OnDestroy, OnInit {
  /** relays */
  faCircleInfo = faCircleInfo;

  /** properties */
  budget: Budget | undefined;
  budgetForm: FormGroup;
  currentYear = new Date().getFullYear();
  endOfMonth = DateTimeService.toLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  endOfYear = DateTimeService.toLocalDateString(new Date(new Date().getFullYear(), 11, 31));
  hasRideCosts = false;
  isLoading = true;
  isSaving = false;
  nextYear = new Date().getFullYear() + 1;
  showLastYear = new Date().getMonth() < 6;

  /** injected services */
  private apiService = inject(ApiService);
  private budgetService = inject(BudgetService);
  private decimalPipe = inject(DecimalPipe);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private stringCurrencyPipe = inject(StringCurrencyPipe);
  private toastr = inject(ToastrService);

  /** fields */
  private $onDestroy = new Subject();
  private customerId?: UUID;

  constructor() {
    this.budgetForm = this.formBuilder.group({
      careBenefitAmount: ['0,00'],
      careBenefitRaise: [{ value: 0, disabled: true }],
      careBenefitRemaining: [{ value: 0, disabled: true }],
      careBenefitRemainingHours: [{ value: 0, disabled: true }],
      customerName: [{ value: '', disabled: true }],
      preventiveCareAmount: ['0,00'],
      preventiveCareRemaining: [{ value: 0, disabled: true }],
      preventiveCareRemainingHours: [{ value: 0, disabled: true }],
      preventiveCareRaise: [{ value: 0, disabled: true }],
      pricePerHour: [{ value: 0, disabled: true }],
      reliefAmount: ['0,00'],
      reliefAmountCurrentYear: [{ value: 0, disabled: true }],
      reliefAmountPreviousYear: [{ value: 0, disabled: true }],
      reliefAmountRaise: [{ value: 0, disabled: true }],
      reliefAmountRemainingHours: [{ value: 0, disabled: true }],
      selfPayAmount: ['0,00'],
      selfPayRaise: ['0,00'],
      selfPayRemaining: [{ value: 0, disabled: true }],
      selfPayRemainingHours: [{ value: 0, disabled: true }],
    });

    this.subscribeToBudgetChanges('reliefAmount');
    this.subscribeToBudgetChanges('careBenefitAmount');
    this.subscribeToBudgetChanges('preventiveCareAmount');
    this.subscribeToBudgetChanges('selfPayAmount');
  }

  ngOnDestroy(): void {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }

  ngOnInit(): void {
    this.customerId = this.router.url.split('/').pop();
    if (!this.customerId) {
      this.router.navigate(['/dashboard/budgets']);
      return;
    }

    this.loadBudget();
  }

  onBudgetChange(amountField: string, remainingHoursField: string) {
    const amount = this.stringCurrencyPipe.finishEditing(this.budgetForm.get(amountField)?.value);
    const remainingHours = Math.floor(parseFloat(amount.replace(',', '.')) / (this.budget?.pricePerHour ?? 1));
    this.budgetForm.patchValue({ [amountField]: amount, [remainingHoursField]: remainingHours }, { emitEvent: false });
  }

  onSave() {
    const budget: BudgetUpdate = {
      careBenefitAmount: parseFloat(this.budgetForm.get('careBenefitAmount')?.value.replace(',', '.')),
      id: this.budget?.id!,
      preventiveCareAmount: parseFloat(this.budgetForm.get('preventiveCareAmount')?.value.replace(',', '.')),
      reliefAmount: parseFloat(this.budgetForm.get('reliefAmount')?.value.replace(',', '.')),
      selfPayAmount: parseFloat(this.budgetForm.get('selfPayAmount')?.value.replace(',', '.')),
      selfPayRaise: parseFloat(this.budgetForm.get('selfPayRaise')?.value.replace(',', '.')),
    };

    this.budgetService
      .putBudget(this.budget!.customerId, budget)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        next: () => {
          this.toastr.success('Budget wurde gespeichert');
          this.router.navigate(['/dashboard/budgets']);
        },
        error: (error) => {
          this.toastr.error(`Budget konnte nicht gespeichert werden: [${error.status}] ${error.error}`);
        },
      });
  }

  private loadBudget() {
    this.isLoading = true;
    forkJoin({ budget: this.budgetService.getBudget(this.customerId!), prices: this.apiService.getCompanyPrices() })
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        next: (result) => {
          this.hasRideCosts = result.prices.rideCostsType == RideCostsType.FlatRate || result.prices.rideCostsType == RideCostsType.Kilometer;
          this.budget = result.budget;
          this.TransferBudgetToForm(this.budget);
          this.isLoading = false;
        },
        error: (error) => {
          this.toastr.error(`Budget konnte nicht geladen werden: [${error.status}] ${error.error}`);
          this.isLoading = false;
        },
      });
  }

  private subscribeToBudgetChanges(field: string) {
    this.budgetForm
      .get(field)
      ?.valueChanges.pipe(takeUntil(this.$onDestroy))
      .subscribe((value) => {
        this.budgetForm.patchValue({ [field]: this.stringCurrencyPipe.transform(value) }, { emitEvent: false });
      });
  }

  private TransferBudgetToForm(budget: Budget) {
    this.budgetForm.patchValue({
      careBenefitAmount: this.decimalPipe.transform(budget.careBenefitAmount, '1.2-2', 'de-DE'),
      careBenefitRaise: this.decimalPipe.transform(budget.careBenefitRaise ?? 0, '1.2-2', 'de-DE'),
      careBenefitRemaining: budget.careBenefitAmount,
      careBenefitRemainingHours: Math.floor(budget.careBenefitAmount / budget.pricePerHour),
      customerName: budget.customerName,
      preventiveCareAmount: this.decimalPipe.transform(budget.preventiveCareAmount, '1.2-2', 'de-DE'),
      preventiveCareRemaining: this.decimalPipe.transform(budget.preventiveCareAmount, '1.2-2', 'de-DE'),
      preventiveCareRemainingHours: Math.floor(budget.preventiveCareAmount / budget.pricePerHour),
      pricePerHour: this.decimalPipe.transform(budget.pricePerHour, '1.2-2', 'de-DE'),
      reliefAmount: this.decimalPipe.transform(budget.reliefAmount, '1.2-2', 'de-DE'),
      reliefAmountCurrentYear: this.decimalPipe.transform(budget.reliefAmountCurrentYear ?? 0, '1.2-2', 'de-DE'),
      reliefAmountPreviousYear: this.decimalPipe.transform(budget.reliefAmountPreviousYear ?? 0, '1.2-2', 'de-DE'),
      reliefAmountRaise: this.decimalPipe.transform(budget.reliefAmountRaise ?? 0, '1.2-2', 'de-DE'),
      reliefAmountRemainingHours: Math.floor(budget.reliefAmount / budget.pricePerHour),
      preventiveCareRaise: this.decimalPipe.transform(budget.preventiveCareRaise ?? 0, '1.2-2', 'de-DE'),
      selfPayAmount: this.decimalPipe.transform(budget.selfPayAmount, '1.2-2', 'de-DE'),
      selfPayRaise: this.decimalPipe.transform(budget.selfPayRaise ?? 0, '1.2-2', 'de-DE'),
      selfPayRemaining: this.decimalPipe.transform(budget.selfPayAmount ?? 0, '1.2-2', 'de-DE'),
      selfPayRemainingHours: Math.floor(budget.selfPayAmount / budget.pricePerHour),
    });
  }
}
