import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { tap } from 'rxjs';
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
  versionData$ = this.httpClient.get<VersionInfo[]>('/assets/version.json').pipe(tap(console.log));
}
