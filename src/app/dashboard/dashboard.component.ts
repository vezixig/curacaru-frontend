// Import necessary modules
import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TopbarComponent } from './topbar/topbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'cura-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    SidebarComponent,
    RouterOutlet,
    HttpClientModule,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  hasCompany: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<number>('https://localhost:7077/company').subscribe(
      (response) => {
        this.hasCompany = response == 13;
      },
      (error) => {
        console.error('API request failed:', error);
      }
    );
  }
}
