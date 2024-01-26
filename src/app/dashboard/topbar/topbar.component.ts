import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { NgbDropdownModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../environments/environment';
import { faBars, faDoorOpen, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UserEmployee } from '../../models/user-employee.model';
import { UserService } from '../../services/user.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'cura-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
  imports: [NgbDropdownModule, FontAwesomeModule],
})
export class TopbarComponent implements OnInit {
  faUser = faUser;
  faBars = faBars;
  faDoorOpen = faDoorOpen;
  user?: UserEmployee;

  constructor(private auth: AuthService, private _userService: UserService, router: Router) {
    router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.offcanvasService.dismiss();
      }
    });
  }

  private offcanvasService = inject(NgbOffcanvas);
  closeResult = '';

  open() {
    this.offcanvasService.open(SidebarComponent, { ariaLabelledBy: 'offcanvas-basic-title' });
  }

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
