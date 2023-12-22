// Import necessary modules
import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TopbarComponent } from './topbar/topbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Employee } from '../models/employee.model';
import { SignupComponent } from '../auth/signup/signup.component';
import { UserEmployee } from '../models/user-employee.model';
import { UserService } from '../services/user.service';

@Component({
  selector: 'cura-dashboard',
  standalone: true,
  imports: [CommonModule, TopbarComponent, SidebarComponent, RouterOutlet, SignupComponent, HttpClientModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  hasCompany: boolean = false;
  hasEmployee: boolean = false;
  isLoading: boolean = true;
  user: UserEmployee | undefined;
  error: any;

  constructor(private _httpClient: HttpClient, private _userService: UserService) {}

  handleSignUpCompleted() {
    this.loadCompany();
  }

  ngOnInit() {
    this.loadCompany();
  }

  private loadCompany() {
    this.isLoading = true;
    this._httpClient.get<UserEmployee>('https://localhost:7077/employee').subscribe({
      next: (result: UserEmployee) => {
        this.hasEmployee = result != null;
        this.hasCompany = result.companyId != null;
        this.isLoading = false;
        this._userService.user = result;
        this.user = result;
      },
      error: (error) => {
        // show error modal
        if (error.status == 404) {
          this.hasEmployee = false;
          this.hasCompany = false;
          this.isLoading = false;
        } else {
          this.isLoading = false;
          this.error = error;
        }
      },
    });
  }
}
