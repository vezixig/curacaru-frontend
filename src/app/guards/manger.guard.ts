import { Injectable, inject } from '@angular/core';
import { UserService } from '@curacaru/services';

@Injectable()
export class ManagerGuard {
  userService = inject(UserService);

  canActivate(): boolean {
    return this.userService.user?.isManager ?? false;
  }
}
