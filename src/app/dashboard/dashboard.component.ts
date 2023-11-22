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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<Employee>('https://localhost:7077/employee').subscribe(
      (response) => {
        this.hasEmployee = response != null;
        this.hasCompany = response.companyId != null;
      },
      (error) => {
        console.error('API request failed:', error);
      }
    );
  }
}
