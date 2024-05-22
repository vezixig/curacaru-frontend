import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomerListEntry } from '@curacaru/models';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoaderTrComponent } from '@curacaru/shared/loader-tr/loader-tr.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomerStatus } from '@curacaru/enums/customer-status.enum';
import { CustomerStatusPipe } from '@curacaru/pipes/customer-status-name.pipe';

@Component({
  selector: 'cura-customer-list-table',
  standalone: true,
  templateUrl: './customer-list-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, RouterModule, LoaderTrComponent, NgbDropdownModule, CustomerStatusPipe],
})
export class CustomerListeTableComponent {
  customerStatus = CustomerStatus;
  customers = input<CustomerListEntry[]>([]);
  isLoading = input(true);
  isManager = input(false);

  onDelete = output<CustomerListEntry>();
  onNavigate = output<CustomerListEntry>();
  onShowAppointments = output<CustomerListEntry>();
  onShowDeploymentReports = output<CustomerListEntry>();
  onShowInvoices = output<CustomerListEntry>();
}
