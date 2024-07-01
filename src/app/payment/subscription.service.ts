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

  static getDescription_(subscriptionType: SubscriptionType): string {
    switch (subscriptionType) {
      case SubscriptionType.Free:
        return 'Testzeitraum';
      case SubscriptionType.Starter:
        return 'Für bis zu 20 Kunden';
      case SubscriptionType.Business:
        return 'Für bis zu 50 Kunden';
      case SubscriptionType.Pro:
        return 'Für bis zu 100 Kunden';
      case SubscriptionType.Premium:
        return 'Für bis zu 1000 Kunden';
      default:
        throw new Error('Invalid subscription type');
    }
  }
}
