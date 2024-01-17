import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerListEntry } from '@curacaru/models/customer-list-entry.model';
import { Customer } from '@curacaru/models/customer.model';
import { Deployment } from '@curacaru/models/deployment.model';
import { InsuranceStatusPipe } from '@curacaru/pipes/insurance-status.pipe';
import { ApiService } from '@curacaru/services/api.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  imports: [CommonModule, FontAwesomeModule, RouterModule, NgxSkeletonLoaderModule, FormsModule, InsuranceStatusPipe],
  providers: [ApiService],
  selector: 'cura-deployment',
  standalone: true,
  templateUrl: './deployment.component.html',
})
export class DeploymentComponent implements OnDestroy, OnInit {
  faDownload = faDownload;

  customers: CustomerListEntry[] = [];
  isLoading: boolean = true;
  selectedCustomerId?: number;
  months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((o) => new Date(2000, o, 2));
  selectedMonth = new Date().getMonth();
  selectedYear = new Date().getFullYear();
  filteredDeployments: Deployment[] = [];

  private deployments: Deployment[] = [];
  private getDeploymentsSubscription?: Subscription;
  private getCustomerListSubscription?: Subscription;

  constructor(private apiService: ApiService, private toastr: ToastrService) {}

  ngOnDestroy(): void {
    this.getDeploymentsSubscription?.unsubscribe();
    this.getCustomerListSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.getCustomerListSubscription = this.apiService.getCustomerList().subscribe({
      next: (result) => {
        this.customers = result;
      },
      error: (error) => {
        this.toastr.error(`Mitarbeiterliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
      },
    });

    this.onDateChanged();
  }

  onDateChanged = () => {
    this.selectedYear = isNaN(this.selectedYear) ? new Date().getFullYear() : Math.round(this.selectedYear);
    this.isLoading = true;
    this.getDeploymentsSubscription = this.apiService.getDeployments(this.selectedYear, +this.selectedMonth + 1).subscribe({
      next: (result) => {
        this.deployments = result;
        this.isLoading = false;
        this.filterDeployments();
      },
      error: (error) => {
        this.toastr.error(`Einsatzliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
      },
    });
  };

  onDownloadReport = (deployment: Deployment) => {
    this.apiService.getDeploymentReport(this.selectedYear, +this.selectedMonth + 1, deployment.customerId, deployment.insuranceStatus).subscribe({
      next: (result) => {
        const blob = new Blob([result], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Einsatznachweis_${this.selectedYear}_${+this.selectedMonth + 1}.pdf`;
        link.click();
      },
      error: (error) => {
        this.toastr.error(`Einsatzliste konnte nicht heruntergeladen werden: [${error.status}] ${error.error}`);
      },
    });
  };

  onCustomerChanged = () => {
    this.filterDeployments();
  };

  private filterDeployments = () => {
    this.filteredDeployments = this.deployments.filter((o) => (this.selectedCustomerId ? o.customerId == this.selectedCustomerId : true));
  };
}
