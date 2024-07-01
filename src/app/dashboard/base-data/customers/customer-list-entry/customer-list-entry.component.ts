import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomerListEntry } from '@curacaru/models';
import { ReplacePipe } from '@curacaru/pipes/replace.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoaderCardComponent } from '@curacaru/shared/loader-card/loader-card.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomerStatus } from '@curacaru/enums/customer-status.enum';
import { CustomerStatusPipe } from '@curacaru/pipes/customer-status-name.pipe';
import { PortraitComponent } from '../../../../shared/portrait/portrait.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'cura-customer-list-entry',
  standalone: true,
  templateUrl: './customer-list-entry.component.html',
  styleUrls: ['./customer-list-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FontAwesomeModule,
    CommonModule,
    ReplacePipe,
    RouterModule,
    LoaderCardComponent,
    NgbDropdownModule,
    CustomerStatusPipe,
    PortraitComponent,
  ],
})
export class CustomerListEntryComponent {
  customerStatus = CustomerStatus;
  customer = input.required<CustomerListEntry>();
  isManager = input(false);
  isLoading = input(false);
  initials = computed(() => `${this.customer()?.firstName[0]}${this.customer()?.lastName[0]}`);

  onDelete = output<CustomerListEntry>();
  onNavigate = output<CustomerListEntry>();
  onShowAppointments = output<CustomerListEntry>();
  onShowDeploymentReports = output<CustomerListEntry>();
  onShowInvoices = output<CustomerListEntry>();
}
