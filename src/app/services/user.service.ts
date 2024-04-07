import { Injectable, inject } from '@angular/core';
import { UserEmployee } from '../models/user-employee.model';
import { ApiService } from './api.service';
import { Observable, ReplaySubject, Subject, map, shareReplay, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user$: Observable<UserEmployee>;
  isManager$: Observable<boolean>;
  clearUser$ = new Subject();

  private apiService = inject(ApiService);

  constructor() {
    this.user$ = this.apiService.getUser().pipe(shareReplay(1), takeUntil(this.clearUser$));
    this.isManager$ = this.user$.pipe(map((user) => user.isManager));
  }

  clearUser() {
    this.clearUser$.next(true);
    this.user$ = this.apiService.getUser().pipe(shareReplay(1), takeUntil(this.clearUser$));
  }
}
