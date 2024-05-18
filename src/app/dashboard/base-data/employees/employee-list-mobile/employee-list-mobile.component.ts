import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Employee } from '@curacaru/models';
import { ReplacePipe } from '@curacaru/pipes/replace.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LoaderCardComponent } from '../../../shared/loader-card/loader-card.component';

@Component({
  selector: 'cura-employee-list-mobile',
  standalone: true,
  templateUrl: './employee-list-mobile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, NgbDropdownModule, ReplacePipe, RouterModule, NgxSkeletonLoaderModule, LoaderCardComponent],
})
export class EmployeeListMobileComponent {
  readonly employees = input<Employee[]>([]);
  readonly isLoading = input<boolean>(false);
  @Output() delete = new EventEmitter<Employee>();
}
