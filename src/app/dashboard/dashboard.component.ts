// Import necessary modules
import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TopbarComponent } from './topbar/topbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Employee } from '../models/employee.model';
import { SignupComponent } from '../auth/signup/signup.component';

@Component({
  selector: 'cura-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    SidebarComponent,
    RouterOutlet,
    SignupComponent,
    HttpClientModule,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  hasCompany: boolean = false;
  hasEmployee: boolean = false;
  isLoading: boolean = true;
  hasError: boolean = false;

  constructor(private http: HttpClient) {}

  handleSignUpCompleted() {
    this.loadCompany();
  }

  ngOnInit() {
    this.loadCompany();
  }

  private loadCompany() {
    this.isLoading = true;
    this.http.get<Employee>('https://localhost:7077/employee').subscribe({
      next: (result: Employee) => {
        this.hasEmployee = result != null;
        this.hasCompany = result.companyId != null;
        this.isLoading = false;
      },
      error: (error) => {
        // show error modal
        if (error.status == 404) {
          this.hasEmployee = false;
          this.hasCompany = false;
          this.isLoading = false;
        } else {
          this.hasError = true;
          console.error('API request failed:', error);
        }
      },
    });
  }
}
