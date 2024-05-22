import { AsyncPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { VersionInfo } from './version.info.model';

@Component({
  selector: 'app-version-info',
  standalone: true,
  imports: [AsyncPipe, DatePipe],
  templateUrl: './version-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionInfoComponent {
  httpClient = inject(HttpClient);
  versionData$ = this.httpClient.get<VersionInfo[]>('/assets/version.json');
}
