import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../environments/environment';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Employee } from '../../models/employee.model';
import { UserEmployee } from '../../models/user-employee.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'cura-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
  imports: [CommonModule, NgbDropdownModule, FontAwesomeModule],
})
export class TopbarComponent implements OnInit {
  faUser = faUser;
  user?: UserEmployee;

  constructor(private auth: AuthService, private _userService: UserService) {}

  handleLogout(): void {
    this.auth.logout({
      logoutParams: {
        returnTo: environment.auth0.callbackUri,
      },
    });
  }

  ngOnInit(): void {
    this.user = this._userService.user;
  }
}
