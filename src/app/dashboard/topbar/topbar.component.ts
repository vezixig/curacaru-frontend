import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { NgbDropdownModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../environments/environment';
import { faBars, faDoorOpen, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UserEmployee } from '../../models/user-employee.model';
import { UserService } from '../../services/user.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'cura-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
  imports: [NgbDropdownModule, FontAwesomeModule, AsyncPipe, RouterModule],
})
export class TopbarComponent {
  faBars = faBars;
  faDoorOpen = faDoorOpen;
  faUser = faUser;
  version = environment.version;

  closeResult = '';
  user$: Observable<UserEmployee>;

  private authService = inject(AuthService);
  private offcanvasService = inject(NgbOffcanvas);
  private router = inject(Router);
  private userService = inject(UserService);

  constructor() {
    this.user$ = this.userService.user$;

    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.offcanvasService.dismiss();
      }
    });
  }

  open() {
    this.offcanvasService.open(SidebarComponent, { ariaLabelledBy: 'offcanvas-basic-title' });
  }

  handleLogout(): void {
    this.authService.logout({
      logoutParams: {
        returnTo: environment.auth0.callbackUri,
      },
    });
  }
}
