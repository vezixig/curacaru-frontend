import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SubscriptionType } from '../subscription-type.enum';
import { subscriptionTypeNamePipe } from '../../pipes/subscription-type-name.pipe';
import { SubscriptionService } from '../subscription.service';

@Component({
  selector: 'cura-change-subscription-modal',
  standalone: true,
  templateUrl: './change-subscription-modal.component.html',
  imports: [CommonModule, FormsModule, subscriptionTypeNamePipe],
})
export class ChangeSubscriptionModalConfirm {
  modal = inject(NgbActiveModal);
  currentSubscription = model<SubscriptionType>();
  newSubscription = model<SubscriptionType>();
  subscriptionEnd = model<Date>();
  isConfirmed = signal(false);
  price = computed(() => SubscriptionService.getPrice(this.newSubscription() ?? 0));
  isUpgrade = computed(() => (this.newSubscription() ?? 0) > (this.currentSubscription() ?? 0));
}
