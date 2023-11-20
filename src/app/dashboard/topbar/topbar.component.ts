import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'cura-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
  imports: [CommonModule, NgbDropdownModule],
})
export class TopbarComponent {
  constructor(private auth: AuthService) {}

  handleLogout(): void {
    this.auth.logout({
      logoutParams: {
        returnTo: environment.auth0.callbackUri,
      },
    });
  }
}
