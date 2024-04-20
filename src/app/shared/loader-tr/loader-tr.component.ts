import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'cura-loader-tr',
  standalone: true,
  imports: [NgxSkeletonLoaderModule],
  templateUrl: './loader-tr.component.html',
  styleUrls: ['./loader-tr.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderTrComponent {
  rowCount = input<number>(3);
  rowIterator = computed(() => Array.from({ length: this.rowCount() }));
  columnCount = input<number>(5);
  columnIterator = computed(() => Array.from({ length: this.columnCount() }));
}
