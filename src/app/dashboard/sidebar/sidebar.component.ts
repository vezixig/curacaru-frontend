import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faClipboard } from '@fortawesome/free-regular-svg-icons';
import { faPersonCane, faUserClock, faUsersGear } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'cura-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [CommonModule, FontAwesomeModule, RouterLink, RouterLinkActive],
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  faUsersGear = faUsersGear;
  faPersonCane = faPersonCane;
  faCalendar = faCalendar;
  faUserClock = faUserClock;
  faClipboard = faClipboard;
}
