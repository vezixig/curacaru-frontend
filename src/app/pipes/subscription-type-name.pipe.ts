import { Pipe, PipeTransform } from '@angular/core';
import { SubscriptionType } from '@curacaru/payment/subscription-type.enum';

@Pipe({
  name: 'subscriptionTypeName',
  standalone: true,
})
export class subscriptionTypeNamePipe implements PipeTransform {
  transform(input: SubscriptionType): string {
    switch (+input) {
      case SubscriptionType.Free:
        return 'Testversion';
      case SubscriptionType.Business:
        return 'Business';
      case SubscriptionType.Premium:
        return 'Premium';
      case SubscriptionType.Pro:
        return 'Pro';
      case SubscriptionType.Starter:
        return 'Starter';
      default:
        return 'Unbekannt';
    }
  }
}
