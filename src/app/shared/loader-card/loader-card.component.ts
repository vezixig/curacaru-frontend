import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'cura-loader-card',
  standalone: true,
  imports: [NgxSkeletonLoaderModule],
  templateUrl: './loader-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderCardComponent {
  itemCount = input<number>(3);
  itemIterator = computed(() => Array.from({ length: this.itemCount() }));
}
