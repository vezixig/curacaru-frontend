import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, forwardRef, inject, input, model, output, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MinimalCustomerListEntry } from '@curacaru/models';
import { ApiService } from '@curacaru/services';
import { NgSelectModule } from '@ng-select/ng-select';
import { UUID } from 'angular2-uuid';
import { Observable, combineLatest, map } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'cura-customer-select',
  standalone: true,
  imports: [CommonModule, NgSelectModule, ReactiveFormsModule, FormsModule],
  templateUrl: './customer-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomerSelectComponent),
      multi: true,
    },
  ],
})
export class CustomerSelectComponent implements ControlValueAccessor, OnInit {
  onChange: any = () => {};
  onTouched: any = () => {};

  selectedCustomerId = model<UUID | undefined>(undefined);
  additionalCustomers = input<MinimalCustomerListEntry[]>([]);
  additionalCustomers$ = toObservable(this.additionalCustomers);
  isDisabled = signal<boolean>(false);
  forDeploymentReports = input<boolean>(false);

  changed = output<UUID | undefined>();

  private readonly apiService = inject(ApiService);

  customers$!: Observable<MinimalCustomerListEntry[]>;

  ngOnInit(): void {
    var customers$ =
      this.forDeploymentReports() === true
        ? this.apiService
            .getMinimalCustomerListDeploymentReports()
            .pipe(
              map((list) => list.map((entry) => ({ customerName: entry.customerName, customerId: entry.customerId } as MinimalCustomerListEntry)))
            )
        : this.apiService.getMinimalCustomerList();

    this.customers$ = combineLatest({ additional: this.additionalCustomers$, list: customers$ }).pipe(
      map((o) => o.list.concat(o.additional).sort((a, b) => a.customerName.localeCompare(b.customerName)))
    );
  }

  writeValue(id: UUID): void {
    this.selectedCustomerId.set(id);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
