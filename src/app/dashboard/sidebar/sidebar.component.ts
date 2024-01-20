import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '@curacaru/services/user.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faBuilding, faFile, faPersonCane, faPersonShelter, faUserClock, faUsersGear } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'cura-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive],
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  faBuilding = faBuilding;
  faCalendar = faCalendar;
  faPersonCane = faPersonCane;
  faPersonShelter = faPersonShelter;
  faUserClock = faUserClock;
  faUsersGear = faUsersGear;
  faFile = faFile;

  isManager: boolean = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.isManager = this.userService.user?.isManager ?? false;
  }
}
