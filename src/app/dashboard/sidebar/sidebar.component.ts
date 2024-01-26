import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '@curacaru/services/user.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faBuilding, faFile, faPersonCane, faPersonShelter, faUserClock, faUsersGear } from '@fortawesome/free-solid-svg-icons';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';

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
  private offcanvasService = inject(NgbOffcanvas);

  isManager: boolean = false;

  constructor(private userService: UserService) {}

  close() {
    this.offcanvasService.dismiss();
  }

  ngOnInit(): void {
    this.isManager = this.userService.user?.isManager ?? false;
  }
}
