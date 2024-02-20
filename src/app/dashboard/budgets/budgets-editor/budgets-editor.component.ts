import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Budget } from '@curacaru/models/budget.model';
import { BudgetService } from '@curacaru/services/budget.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { InputComponent } from '@curacaru/shared/input/input.component';
import { UUID } from 'angular2-uuid';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { StringCurrencyPipe } from '@curacaru/pipes/string-currency.pipe';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { DecimalPipe } from '@angular/common';
import { DateTimeService } from '@curacaru/services';

@Component({
  imports: [ReactiveFormsModule, FormsModule, RouterModule, InputComponent, NgbAccordionModule, NgxSkeletonLoaderModule],
  providers: [BudgetService, StringCurrencyPipe, DecimalPipe],
  selector: 'cura-budget-editor',
  standalone: true,
  templateUrl: './budgets-editor.component.html',
})
export class BudgetsEditorComponent implements OnDestroy, OnInit {
  /** properties */
  budget: Budget | undefined;
  budgetForm: FormGroup;
  isLoading = true;
  showLastYear = new Date().getMonth() <= 6;
  currentYear = new Date().getFullYear();
  nextYear = new Date().getFullYear() + 1;
  showReliefAmount = false;
  showCareBenefit = false;
  endOfMonth = DateTimeService.toLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

  /** injected services */
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
      customerName: [{ value: '', disabled: true }],
      careBenefitAmount: ['0,00'],
      careBenefitRemaining: [{ value: 0, disabled: true }],
      careBenefitRemainingHours: [{ value: 0, disabled: true }],
      careBenefitRaise: [{ value: 0, disabled: true }],
      reliefAmount: ['0,00'],
      reliefAmountRemainingHours: [{ value: 0, disabled: true }],
      reliefAmountPreviousYear: [{ value: 0, disabled: true }],
      reliefAmountCurrentYear: [{ value: 0, disabled: true }],
      reliefAmountRaise: [{ value: 0, disabled: true }],
      pricePerHour: [{ value: 0, disabled: true }],
    });

    this.budgetForm
      .get('reliefAmount')
      ?.valueChanges.pipe(takeUntil(this.$onDestroy))
      .subscribe((value) => {
        this.budgetForm.patchValue({ reliefAmount: this.stringCurrencyPipe.transform(value) }, { emitEvent: false });
      });
  }

  onCareBenefitChange() {
    let careBenefitAmount = this.stringCurrencyPipe.finishEditing(this.budgetForm.get('careBenefitAmount')?.value);
    let remainingHours = Math.floor(parseFloat(careBenefitAmount.replace(',', '.')) / (this.budget?.pricePerHour ?? 1));

    this.budgetForm.patchValue({ careBenefitAmount: careBenefitAmount, careBenefitRemainingHours: remainingHours }, { emitEvent: false });
  }

  onReliefAmountChange() {
    let reliefAmount = this.stringCurrencyPipe.finishEditing(this.budgetForm.get('reliefAmount')?.value);
    let remainingHours = Math.floor(parseFloat(reliefAmount.replace(',', '.')) / (this.budget?.pricePerHour ?? 1));

    this.budgetForm.patchValue({ reliefAmount: reliefAmount, reliefAmountRemainingHours: remainingHours }, { emitEvent: false });
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

  onSave() {}

  private loadBudget() {
    this.isLoading = true;
    this.budgetService
      .getBudget(this.customerId!)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        next: (next) => {
          console.log(next);
          this.budget = next;
          this.TransferBudgetToForm(this.budget);
          this.isLoading = false;
        },
        error: (error) => {
          this.toastr.error(`Budget konnte nicht geladen werden: [${error.status}] ${error.error}`);
          this.isLoading = false;
        },
      });
  }

  private TransferBudgetToForm(budget: Budget) {
    this.budgetForm.patchValue({
      careBenefitAmount: budget.careBenefitAmount,
      careBenefitRemaining: budget.careBenefitAmount,
      careBenefitRaise: this.decimalPipe.transform(budget.careBenefitRaise ?? 0, '1.2-2', 'de-DE'),
      careBenefitRemainingHours: Math.floor(budget.careBenefitAmount / budget.pricePerHour),
      customerName: budget.customerName,
      pricePerHour: this.decimalPipe.transform(budget.pricePerHour, '1.2-2', 'de-DE'),
      reliefAmount: budget.reliefAmount,
      reliefAmountRemainingHours: Math.floor(budget.reliefAmount / budget.pricePerHour),
      reliefAmountPreviousYear: this.decimalPipe.transform(budget.reliefAmountPreviousYear ?? 0, '1.2-2', 'de-DE'),
      reliefAmountCurrentYear: this.decimalPipe.transform(budget.reliefAmountCurrentYear ?? 0, '1.2-2', 'de-DE'),
      reliefAmountRaise: this.decimalPipe.transform(budget.reliefAmountRaise ?? 0, '1.2-2', 'de-DE'),
    });

    this.showReliefAmount = budget.doClearanceReliefAmount;
    this.showCareBenefit = budget.doClearanceCareBenefit;
  }
}
