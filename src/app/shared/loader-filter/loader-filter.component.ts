import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'cura-loader-filter',
  standalone: true,
  imports: [NgxSkeletonLoaderModule],
  templateUrl: './loader-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderFilterComponent {
  itemCount = input<number>(1);
  itemIterator = computed(() => Array.from({ length: this.itemCount() }));
}
