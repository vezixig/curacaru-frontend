import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, ErrorHandler, OnInit, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionStatus } from './subscription-status.model';
import { Observable, Subject, Subscription, mergeMap, startWith, tap } from 'rxjs';
import { SubscriptionType } from './subscription-type.enum';
import { subscriptionTypeNamePipe } from '../pipes/subscription-type-name.pipe';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ChangeSubscriptionModalConfirm } from './change-subscription-modal/change-subscription-modal.component';
import { ErrorHandlerService } from '@curacaru/services';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { PriceComponent } from './price/price.component';

@Component({
  selector: 'app-payment',
  standalone: true,
  templateUrl: './payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, subscriptionTypeNamePipe, PriceComponent],
})
export class PaymentComponent implements OnInit {
  private readonly httpClient = inject(HttpClient);
  private readonly toastr = inject(ToastrService);
  private readonly route = inject(ActivatedRoute);
  private readonly refresh$ = new Subject<void>();
  private readonly router = inject(Router);
  private readonly modalService = inject(NgbModal);
  private readonly errorHandler = inject(ErrorHandlerService);

  protected readonly apiUrl = environment.auth0.api.serverUrl;

  subscriptionType = SubscriptionType;

  isLoading = signal(true);
  subscriptionStatus$: Observable<SubscriptionStatus>;
  isProcessingSession = signal(false);

  constructor() {
    this.subscriptionStatus$ = this.refresh$.pipe(
      startWith({}),
      mergeMap(() => this.httpClient.get<SubscriptionStatus>(this.apiUrl + '/payment/status').pipe(tap(() => this.isLoading.set(false))))
    );
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('session_id')) {
      this.isLoading.set(false);
      this.isProcessingSession.set(true);
      this.httpClient
        .post<any>(this.apiUrl + '/payment/finish-session?sessionId=' + this.route.snapshot.queryParamMap.get('session_id'), {})
        .subscribe({
          next: (response) => {
            this.router.navigate(['/dashboard/subscription']);
            this.isProcessingSession.set(false);
          },
        });
    }
  }

  onCancelSubscription(subscription: SubscriptionStatus) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.cancelSubscription());
    modalRef.componentInstance.title = 'Abonnement beenden';
    modalRef.componentInstance.text = `Möchtest du dein Abonnement wirklich beenden? Es wird dann nicht mehr automatisch verlängert und endet nach dem aktuellen Zeitraum.`;
  }

  private cancelSubscription() {
    this.httpClient.post<any>(this.apiUrl + '/payment/subscription/cancel', {}).subscribe({
      next: () => {
        this.toastr.success('Abonnement wurde erfolgreich gestoppt.');
        this.refresh$.next();
      },
    });
  }

  renewSubscription() {
    this.httpClient.post<any>(this.apiUrl + '/payment/subscription/renew', {}).subscribe({
      next: () => {
        this.toastr.success('Abonnement wurde erfolgreich reaktiviert.');
        this.refresh$.next();
      },
    });
  }

  startSession(subscriptionType: SubscriptionType) {
    this.httpClient.post<any>(this.apiUrl + '/payment/start-session?type=' + subscriptionType, {}).subscribe({
      next: (response) => {
        console.log('response', response);
        window.location.href = response.url;
      },
      error: (error) => this.errorHandler.handleError(error),
    });
  }

  onDelete() {
    this.httpClient.delete<any>(this.apiUrl + '/payment/subscription', {}).subscribe({
      next: () => {
        this.toastr.success('Abonnement wurde erfolgreich gelöscht.');
        this.refresh$.next();
      },
      error: (error) => this.errorHandler.handleError(error),
    });
  }

  onChangeSubscription(data: { current: SubscriptionStatus; newType: SubscriptionType }) {
    const modalRef = this.modalService.open(ChangeSubscriptionModalConfirm, { size: 'lg' });
    console.log(modalRef.componentInstance);
    const componentRef = modalRef.componentInstance as ChangeSubscriptionModalConfirm;
    componentRef.currentSubscription.set(data.current.type);
    componentRef.subscriptionEnd.set(data.current.periodEnd);
    componentRef.newSubscription.set(data.newType);
    modalRef.result.then(() => (componentRef.isUpgrade() ? this.upgradeSubscription(data.newType) : this.downgradeSubscription(data.newType)));
  }

  private upgradeSubscription(subscriptionType: SubscriptionType) {
    this.httpClient.post<any>(this.apiUrl + '/payment/subscription/upgrade?type=' + subscriptionType, {}).subscribe({
      next: (response) => {
        console.log('response', response);
        this.toastr.success('Abonnement wurde erfolgreich hochgestuft.');
        this.refresh$.next();
      },
      error: (error) => this.errorHandler.handleError(error),
    });
  }

  private downgradeSubscription(subscriptionType: SubscriptionType) {
    this.httpClient.post<any>(this.apiUrl + '/payment/subscription/downgrade?type=' + subscriptionType, {}).subscribe({
      next: (response) => {
        console.log('response', response);
        this.toastr.success('Abonnement wurde erfolgreich geändert.');
        this.refresh$.next();
      },
      error: (error) => this.errorHandler.handleError(error),
    });
  }
}
