import { Pipe, PipeTransform } from '@angular/core';
import { CustomerStatus, CustomerStatusToString } from '@curacaru/enums/customer-status.enum';

@Pipe({
  name: 'customerStatus',
  standalone: true,
})
export class CustomerStatusPipe implements PipeTransform {
  transform(status: CustomerStatus): string {
    return CustomerStatusToString(status);
  }
}
