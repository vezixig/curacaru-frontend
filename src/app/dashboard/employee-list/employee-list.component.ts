import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Employee } from '../../models/employee.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { RouterModule } from '@angular/router';

@Component({
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  selector: 'cura-employee-list',
  standalone: true,
  templateUrl: './employee-list.component.html',
})
export class EmployeeListComponent implements OnInit {
  faGear = faGear;
  faTrashCan = faTrashCan;

  employees: Employee[] = [];

  constructor(private httpClient: HttpClient) {}

  ngOnInit(): void {
    this.httpClient
      .get<Employee[]>('https://localhost:7077/employee/list')
      .subscribe({
        next: (result) => {
          this.employees = result;
        },
        error: (error) => {
          console.error('API request failed:', error);
        },
      });
  }
}
