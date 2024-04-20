import { Component, inject } from '@angular/core';
import { LoaderService } from '@curacaru/services/loader.service';

@Component({
  selector: 'cura-loader',
  standalone: true,
  templateUrl: './loader.component.html',
})
export class LoaderComponent {
  isLoading = inject(LoaderService).isLoading;
}
