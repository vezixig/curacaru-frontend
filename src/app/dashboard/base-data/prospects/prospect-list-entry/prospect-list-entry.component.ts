import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomerListEntry } from '@curacaru/models';
import { PortraitComponent } from '@curacaru/shared/portrait/portrait.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'cura-prospect-list-entry',
  standalone: true,
  templateUrl: './prospect-list-entry.component.html',
  styleUrl: './prospect-list-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FontAwesomeModule, PortraitComponent, RouterModule],
})
export class ProspectListEntryComponent {
  customer = input<CustomerListEntry>();
  initials = computed(() => `${this.customer()?.firstName[0]}${this.customer()?.lastName[0]}`);
  isLoading = input(false);

  onDelete = output<CustomerListEntry>();
}
