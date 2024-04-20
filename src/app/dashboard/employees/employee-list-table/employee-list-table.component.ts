import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Employee } from '@curacaru/models';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LoaderTrComponent } from '@curacaru/shared/loader-tr/loader-tr.component';

@Component({
  selector: 'cura-employee-list-table',
  standalone: true,
  templateUrl: './employee-list-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FontAwesomeModule, RouterModule, NgxSkeletonLoaderModule, LoaderTrComponent],
})
export class EmployeeListTableComponent {
  readonly employees = input<Employee[]>([]);
  readonly isLoading = input<boolean>(false);
  @Output() delete = new EventEmitter<Employee>();
}
