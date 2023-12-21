import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faClipboard } from '@fortawesome/free-regular-svg-icons';
import { faPersonCane, faUserClock, faUsersGear } from '@fortawesome/free-solid-svg-icons';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'cura-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [CommonModule, FontAwesomeModule, RouterLink, RouterLinkActive],
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  faUsersGear = faUsersGear;
  faPersonCane = faPersonCane;
  faCalendar = faCalendar;
  faUserClock = faUserClock;
  faClipboard = faClipboard;

  isManager: boolean = false;

  constructor(private _userService: UserService) {}

  ngOnInit(): void {
    this.isManager = this._userService.user?.isManager ?? false;
  }
}
