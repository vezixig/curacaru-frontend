import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Page } from '@curacaru/models/page.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'cura-paging',
  imports: [FontAwesomeModule, RouterModule],
  templateUrl: './paging.component.html',
  standalone: true,
})
export class PagingComponent<T> {
  page = input<Page<T> | null>();
  link = input<string>();
}
