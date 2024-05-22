import { Injectable, inject } from '@angular/core';
import { UserService } from '@curacaru/services';
import { Observable } from 'rxjs';

@Injectable()
export class ManagerGuard {
  userService = inject(UserService);

  canActivate(): Observable<boolean> {
    return this.userService.isManager$;
  }
}
