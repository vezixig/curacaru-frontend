import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Observable, Subject, finalize, map, mergeMap, startWith, tap } from 'rxjs';
import { WebsiteIntegrationModel } from './website-integration.model';
import { WebsiteIntegrationRepository } from './website-integration.repository';
import { FormsModule } from '@angular/forms';
import { ErrorHandlingService } from '@curacaru/services';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-website-integration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './website-integration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteIntegrationComponent {
  readonly model$: Observable<WebsiteIntegrationModel>;
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  private readonly errorHandlingService = inject(ErrorHandlingService);
  private readonly websiteIntegrationRepository = inject(WebsiteIntegrationRepository);
  private readonly toastrService = inject(ToastrService);

  private readonly $refresh = new Subject<void>();

  constructor() {
    this.isLoading.set(true);
    this.model$ = this.$refresh.pipe(
      startWith({}),
      mergeMap(() =>
        this.websiteIntegrationRepository.getWebsiteIntegration().pipe(
          map((o) => (o === null ? { id: '', color: '', fontSize: 0 } : o)),
          tap(() => this.isLoading.set(false))
        )
      )
    );
  }

  onSave(model: WebsiteIntegrationModel) {
    this.isSaving.set(true);

    this.websiteIntegrationRepository
      .updateWebsiteIntegration(model)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.$refresh.next();
          this.toastrService.success('Änderungen erfolgreich gespeichert.');
        },
        error: (error) => this.errorHandlingService.handleError(error),
      });
  }

  onActivate() {
    this.isLoading.set(true);

    this.websiteIntegrationRepository.activateWebsiteIntegration().subscribe({
      next: () => this.$refresh.next(),
      error: (error) => this.errorHandlingService.handleError(error),
    });
  }

  onCancel = () => this.$refresh.next();
}
