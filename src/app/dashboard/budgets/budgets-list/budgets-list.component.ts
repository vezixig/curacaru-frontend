import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BudgetListEntry } from '@curacaru/models/budget-list-entry.model';
import { BudgetService } from '@curacaru/services/budget.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Subject, takeUntil } from 'rxjs';

@Component({
  imports: [NgxSkeletonLoaderModule, CurrencyPipe, DecimalPipe, FontAwesomeModule, RouterModule],
  providers: [BudgetService],
  selector: 'cura-budgets-list',
  standalone: true,
  templateUrl: './budgets-list.component.html',
})
export class BudgetListComponent implements OnInit, OnDestroy {
  faGear = faGear;

  isLoading = true;
  budgetList: BudgetListEntry[] = [];
  private budgetService = inject(BudgetService);
  private $onDestroy = new Subject();

  ngOnInit(): void {
    this.budgetService
      .getBudgetList()
      .pipe(takeUntil(this.$onDestroy))
      .subscribe((result) => {
        this.isLoading = false;
        this.budgetList = result;
      });
  }

  ngOnDestroy(): void {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }
}
