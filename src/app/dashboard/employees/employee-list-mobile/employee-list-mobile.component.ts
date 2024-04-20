import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Employee } from '@curacaru/models';
import { ReplacePipe } from '@curacaru/pipes/replace.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'cura-employee-list-mobile',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, ReplacePipe, RouterModule],
  templateUrl: './employee-list-mobile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeListMobileComponent {
  readonly employees = input<Employee[]>([]);
  readonly isLoading = input<boolean>(false);
  @Output() delete = new EventEmitter<Employee>();
}
