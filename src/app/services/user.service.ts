import { Injectable, inject } from '@angular/core';
import { UserEmployee } from '../models/user-employee.model';
import { ApiService } from './api.service';
import { Observable, ReplaySubject, map, shareReplay, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user$: Observable<UserEmployee>;
  isManager$: Observable<boolean>;
  clearUser$: ReplaySubject<void> = new ReplaySubject(1);

  private apiService = inject(ApiService);

  constructor() {
    this.user$ = this.apiService.getUser().pipe(takeUntil(this.clearUser$), shareReplay(1));
    this.isManager$ = this.user$.pipe(map((user) => user.isManager));
  }

  clearUser() {
    this.clearUser$.next();
  }
}
