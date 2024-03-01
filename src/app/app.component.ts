import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent, LoginComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'curacaru';
  isAuthenticated: boolean = false;
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.error$.subscribe((error) => {
      console.error(error);
      this.isAuthenticated = false;
    });
    this.authService.isAuthenticated$.subscribe((next) => {
      this.isAuthenticated = next;
      var url = this.router.url === '/' ? '/dashboard' : this.router.url;
      if (next) this.router.navigate([url]);
    });
  }
}
