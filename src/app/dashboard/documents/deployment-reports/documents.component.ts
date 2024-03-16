import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { MinimalCustomerListEntry } from '@curacaru/models/minimal-customer-list-entry.model';
import { InsuranceStatusPipe } from '@curacaru/pipes/insurance-status.pipe';
import { ApiService } from '@curacaru/services/api.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBuilding } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo, faDownload } from '@fortawesome/free-solid-svg-icons';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  imports: [CommonModule, FontAwesomeModule, RouterModule, NgxSkeletonLoaderModule, FormsModule, InsuranceStatusPipe],
  providers: [ApiService],
  selector: 'cura-deployment',
  standalone: true,
  templateUrl: './documents.component.html',
})
export class DeploymentReportsComponent implements OnDestroy, OnInit {
  faDownload = faDownload;
  faBuilding = faBuilding;
  faCircleInfo = faCircleInfo;

  customers: MinimalCustomerListEntry[] = [];
  selectedCustomerId?: number;
  filteredCustomers: MinimalCustomerListEntry[] = [];
  year = new Date().getFullYear();
  readonly isLoading = signal(false);

  private getDeploymentsSubscription?: Subscription;
  private getCustomerListSubscription?: Subscription;
  InsuranceStatus = InsuranceStatus;

  constructor(private apiService: ApiService, private toastr: ToastrService) {}

  ngOnDestroy(): void {
    this.getDeploymentsSubscription?.unsubscribe();
    this.getCustomerListSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.getCustomerListSubscription = this.apiService.getMinimalCustomerList().subscribe({
      next: (result) => {
        this.customers = result;
        this.filterCustomers();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toastr.error(`Mitarbeiterliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
        this.isLoading.set(false);
      },
    });
  }

  onDownloadDeploymentReport = (customer: MinimalCustomerListEntry) => {
    this.isLoading.set(true);

    this.apiService.getDeploymentReport(customer.customerId, customer.insuranceStatus).subscribe({
      next: (result) => {
        const blob = new Blob([result], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Einsatznachweis - ${customer.customerName}.pdf`;
        link.click();
      },
      error: (error) => {
        this.toastr.error(`Einsatznachweis konnte nicht heruntergeladen werden: [${error.status}] ${error.error}`);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  };

  onCustomerChanged() {
    this.filterCustomers();
  }

  onYearChanged() {
    this.year = Math.abs(Math.floor(this.year));
  }

  private filterCustomers = () => {
    this.filteredCustomers = this.customers.filter((o) => (this.selectedCustomerId ? o.customerId == this.selectedCustomerId : true));
  };
}
