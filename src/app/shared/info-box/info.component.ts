import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faCircleExclamation, faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'cura-info',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoComponent {
  faCircleCheck = faCircleCheck;
  faCircleExclamation = faCircleExclamation;
  faCircleInfo = faCircleInfo;
  faTriangleExclamation = faTriangleExclamation;

  type = input<'info' | 'warning' | 'error' | 'success'>('info');
  icon = computed(() => this.GetIcon(this.type()));

  GetIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return this.faCircleExclamation;
      case 'error':
        return this.faTriangleExclamation;
      case 'success':
        return this.faCircleCheck;
      default:
      case 'info':
        return this.faCircleInfo;
    }
  };
}
