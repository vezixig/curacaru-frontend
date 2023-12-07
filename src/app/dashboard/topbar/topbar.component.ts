import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../environments/environment';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Employee } from '../../models/employee.model';
import { UserEmployee } from '../../models/user-employee.model';

@Component({
  selector: 'cura-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
  imports: [CommonModule, NgbDropdownModule, FontAwesomeModule],
})
export class TopbarComponent {
  faUser = faUser;
  @Input() public employee: UserEmployee | undefined;
  constructor(private auth: AuthService) {}

  handleLogout(): void {
    this.auth.logout({
      logoutParams: {
        returnTo: environment.auth0.callbackUri,
      },
    });
  }
}
