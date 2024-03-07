import { AuthService } from '@auth0/auth0-angular';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';

import { DashboardComponent } from '@curacaru/dashboard/dashboard.component';
import { LoginComponent } from '@curacaru/auth/login/login.component';
import { UserService } from '@curacaru/services';

@Component({
  imports: [DashboardComponent, LoginComponent],
  standalone: true,
  styleUrl: './app.component.scss',
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  isAuthenticated: boolean = false;

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  ngOnInit(): void {
    this.authService.error$.subscribe((error) => {
      console.error(error);
      this.isAuthenticated = false;
    });

    this.authService.isAuthenticated$
      .pipe(
        tap((result) => (this.isAuthenticated = result)),
        switchMap(() => this.userService.user$)
      )
      .subscribe(() => {
        var route = location.href.split('/').splice(3).join('/');
        route = route === '' ? '/dashboard' : route;
        if (this.isAuthenticated) this.router.navigateByUrl(route);
      });
  }
}
