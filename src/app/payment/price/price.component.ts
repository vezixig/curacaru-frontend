import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SubscriptionStatus } from '../subscription-status.model';
import { SubscriptionType } from '../subscription-type.enum';
import { subscriptionTypeNamePipe } from '../../pipes/subscription-type-name.pipe';
import { SubscriptionService } from '../subscription.service';

@Component({
  selector: 'cura-price',
  standalone: true,
  templateUrl: './price.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, subscriptionTypeNamePipe],
})
export class PriceComponent {
  subscriptionType = SubscriptionType;
  subscription = input.required<SubscriptionStatus>();
  type = input.required<SubscriptionType>();
  fee = computed(() => SubscriptionService.getPrice(this.type()));
  description = computed(() => SubscriptionService.getDescription_(this.type()));

  renewSubscription = output();
  changeSubscription = output<{ current: SubscriptionStatus; newType: SubscriptionType }>();
  startSession = output<SubscriptionType>();
}
