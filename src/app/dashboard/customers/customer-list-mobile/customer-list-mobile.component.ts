import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomerListEntry } from '@curacaru/models';
import { ReplacePipe } from '@curacaru/pipes/replace.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoaderCardComponent } from '@curacaru/shared/loader-card/loader-card.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomerStatusPipe } from '../../../pipes/customer-status-name.pipe';
import { CustomerStatus } from '@curacaru/enums/customer-status.enum';

@Component({
  selector: 'cura-customer-list-mobile',
  standalone: true,
  templateUrl: './customer-list-mobile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, ReplacePipe, RouterModule, LoaderCardComponent, NgbDropdownModule, CustomerStatusPipe],
})
export class CustomerListMobileComponent {
  customerStatus = CustomerStatus;
  customers = input<CustomerListEntry[]>([]);
  isManager = input(false);
  isLoading = input(false);

  onDelete = output<CustomerListEntry>();
  onNavigate = output<CustomerListEntry>();
  onShowAppointments = output<CustomerListEntry>();
  onShowDeploymentReports = output<CustomerListEntry>();
  onShowInvoices = output<CustomerListEntry>();
}
