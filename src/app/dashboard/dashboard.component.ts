import { Component } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { TopbarComponent } from './topbar/topbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { Router, RouterOutlet } from '@angular/router';

import { SignupComponent } from '../auth/signup/signup.component';
import { UserEmployee } from '../models/user-employee.model';
import { UserService } from '../services/user.service';
import { ApiService } from '../services/api.service';
import { LoaderComponent } from '../shared/loader/loader.component';

@Component({
  selector: 'cura-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [ApiService],
  imports: [TopbarComponent, SidebarComponent, RouterOutlet, SignupComponent, HttpClientModule, LoaderComponent],
})
export class DashboardComponent {
  hasCompany = false;
  hasEmployee = false;
  isLoading = true;
  user?: UserEmployee;
  error: any;

  constructor(private userService: UserService) {}

  handleSignUpCompleted() {
    this.loadCompany();
  }

  ngOnInit() {
    this.loadCompany();
  }

  private loadCompany() {
    this.isLoading = true;
    this.userService.user$.subscribe({
      next: (result) => {
        this.hasEmployee = result != null;
        this.hasCompany = result.companyId != null;
        this.isLoading = false;
        this.user = result;
      },
      error: (error) => {
        this.error = error.status != 404;
        this.isLoading = false;
        this.hasCompany = false;
        console.error(error);
      },
    });
  }
}
