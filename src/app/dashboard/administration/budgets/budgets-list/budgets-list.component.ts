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
import { Subject, forkJoin, mergeMap, takeUntil } from 'rxjs';
import { Page } from '@curacaru/models/page.model';
import { Store } from '@ngrx/store';
import { BudgetsListState } from '@curacaru/state/budgets-list.state';
import { PagingComponent } from '@curacaru/shared/paging/paging.component';

@Component({
  providers: [BudgetService],
  selector: 'cura-budgets-list',
  standalone: true,
  templateUrl: './budgets-list.component.html',
  imports: [NgxSkeletonLoaderModule, CurrencyPipe, DecimalPipe, FontAwesomeModule, RouterModule, PagingComponent],
})
export class BudgetListComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<BudgetsListState>);
  private readonly budgetService = inject(BudgetService);
  private readonly apiService = inject(ApiService);
  private readonly $onDestroy = new Subject<void>();

  faGear = faGear;
  faInfoCircle = faInfoCircle;
  faMoney = faMoneyBill;
  faClock = faClock;

  isLoading = true;
  showPriceInfo = false;
  budgetList: Page<BudgetListEntry> = { items: [], page: 1, pageCount: 1 };

  ngOnInit(): void {
    this.store
      .pipe(
        mergeMap((next) =>
          forkJoin({ budgets: this.budgetService.getBudgetList(next.budgetsList.page), prices: this.apiService.getCompanyPrices() })
        ),
        takeUntil(this.$onDestroy)
      )
      .subscribe((result) => {
        this.isLoading = false;
        this.showPriceInfo = result.prices.pricePerHour == 0;
        this.budgetList = result.budgets;
      });
  }

  ngOnDestroy(): void {
    this.$onDestroy.next();
    this.$onDestroy.complete();
  }

  onPageChange($event: number) {
    this.store.dispatch({ type: '[BudgetsListState] Change page', page: $event });
  }
}
