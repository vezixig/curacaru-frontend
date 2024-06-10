import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, inject, model, output, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '@curacaru/services';
import { NgSelectModule } from '@ng-select/ng-select';
import { UUID } from 'angular2-uuid';

@Component({
  selector: 'cura-employee-select',
  standalone: true,
  imports: [CommonModule, NgSelectModule, ReactiveFormsModule, FormsModule],
  templateUrl: './employee-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EmployeeSelectComponent),
      multi: true,
    },
  ],
})
export class EmployeeSelectComponent implements ControlValueAccessor {
  onChange: any = () => {};
  onTouched: any = () => {};

  selectedEmployeeId = model<UUID | undefined>(undefined);
  isDisabled = signal<boolean>(false);

  changed = output<UUID | undefined>();

  private readonly apiService = inject(ApiService);

  employees$ = this.apiService.getEmployeeBaseList();

  writeValue(id: UUID): void {
    this.selectedEmployeeId.set(id);
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
