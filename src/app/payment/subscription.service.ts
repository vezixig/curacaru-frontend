import { Injectable } from '@angular/core';
import { SubscriptionType } from './subscription-type.enum';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  static getPrice(subscriptionType: SubscriptionType): number {
    switch (subscriptionType) {
      case SubscriptionType.Free:
        return 0;
      case SubscriptionType.Starter:
        return 30;
      case SubscriptionType.Business:
        return 70;
      case SubscriptionType.Pro:
        return 130;
      case SubscriptionType.Premium:
        return 210;
      default:
        throw new Error('Invalid subscription type');
    }
  }
}
