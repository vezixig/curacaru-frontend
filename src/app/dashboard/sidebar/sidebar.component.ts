import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '@curacaru/services/user.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faBuilding, faCoins, faFile, faPersonCane, faPersonShelter, faStopwatch, faUserClock, faUsersGear } from '@fortawesome/free-solid-svg-icons';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'cura-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive, AsyncPipe],
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  faBuilding = faBuilding;
  faCalendar = faCalendar;
  faCoins = faCoins;
  faFile = faFile;
  faPersonCane = faPersonCane;
  faPersonShelter = faPersonShelter;
  faStopwatch = faStopwatch;
  faUserClock = faUserClock;
  faUsersGear = faUsersGear;

  private offcanvasService = inject(NgbOffcanvas);
  private userService = inject(UserService);

  isManager = this.userService.isManager$;

  /** Closes the sidebar */
  close() {
    this.offcanvasService.dismiss();
  }
}
