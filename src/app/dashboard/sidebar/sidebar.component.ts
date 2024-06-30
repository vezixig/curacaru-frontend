import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '@curacaru/services/user.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowsSpin,
  faBuilding,
  faCalendar,
  faCoins,
  faFileInvoiceDollar,
  faFileLines,
  faFileSignature,
  faPersonCane,
  faPersonShelter,
  faStopwatch,
  faUserClock,
  faUsersGear,
} from '@fortawesome/free-solid-svg-icons';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'cura-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive, AsyncPipe],
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  faArrowsSpin = faArrowsSpin;
  faBuilding = faBuilding;
  faCalendar = faCalendar;
  faCoins = faCoins;
  faFileInvoiceDollar = faFileInvoiceDollar;
  faFileLines = faFileLines;
  faPersonCane = faPersonCane;
  faPersonShelter = faPersonShelter;
  faFileSignature = faFileSignature;
  faStopwatch = faStopwatch;
  faUserClock = faUserClock;
  faUsersGear = faUsersGear;
  version = environment.version;

  private offcanvasService = inject(NgbOffcanvas);
  private userService = inject(UserService);

  isManager = this.userService.isManager$;

  /** Closes the sidebar */
  close() {
    this.offcanvasService.dismiss();
  }
}
