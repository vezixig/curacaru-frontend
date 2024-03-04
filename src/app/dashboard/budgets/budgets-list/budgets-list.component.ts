import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BudgetListEntry } from '@curacaru/models/budget-list-entry.model';
import { ApiService } from '@curacaru/services';
import { BudgetService } from '@curacaru/services/budget.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import { faGear, faInfoCircle, faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Subject, forkJoin, takeUntil } from 'rxjs';

@Component({
  imports: [NgxSkeletonLoaderModule, CurrencyPipe, DecimalPipe, FontAwesomeModule, RouterModule],
  providers: [BudgetService],
  selector: 'cura-budgets-list',
  standalone: true,
  templateUrl: './budgets-list.component.html',
})
export class BudgetListComponent implements OnInit, OnDestroy {
  faGear = faGear;
  faInfoCircle = faInfoCircle;
  faMoney = faMoneyBill;
  faClock = faClock;

  isLoading = true;
  showPriceInfo = false;
  budgetList: BudgetListEntry[] = [];
  private budgetService = inject(BudgetService);
  private apiService = inject(ApiService);
  private $onDestroy = new Subject();

  ngOnInit(): void {
    forkJoin({ budgets: this.budgetService.getBudgetList(), prices: this.apiService.getCompanyPrices() })
      .pipe(takeUntil(this.$onDestroy))
      .subscribe((result) => {
        this.isLoading = false;
        this.showPriceInfo = result.prices.pricePerHour == 0;
        this.budgetList = result.budgets;
      });
  }

  ngOnDestroy(): void {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }
}
