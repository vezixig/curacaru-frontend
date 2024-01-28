import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { MinimalCustomerListEntry } from '@curacaru/models/minimal-customer-list-entry.model';
import { InsuranceStatusPipe } from '@curacaru/pipes/insurance-status.pipe';
import { ApiService } from '@curacaru/services/api.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBuilding } from '@fortawesome/free-regular-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
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
export class DocumentsComponent implements OnDestroy, OnInit {
  faDownload = faDownload;
  faBuilding = faBuilding;

  customers: MinimalCustomerListEntry[] = [];
  isLoading: boolean = true;
  selectedCustomerId?: number;
  filteredCustomers: MinimalCustomerListEntry[] = [];
  year = new Date().getFullYear();

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
        this.isLoading = false;
      },
      error: (error) => {
        this.toastr.error(`Mitarbeiterliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
        this.isLoading = false;
      },
    });
  }

  onDownloadDeploymentReport = (customer: MinimalCustomerListEntry) => {
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
    });
  };

  onDownloadAssignmentDeclaration = (customer: MinimalCustomerListEntry) => {
    this.apiService.getAssignmentDeclaration(customer.customerId, this.year).subscribe({
      next: (result) => {
        const blob = new Blob([result], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Abtretungserklärung ${this.year} - ${customer.customerName}.pdf`;
        link.click();
      },
      error: (error) => {
        this.toastr.error(`Abtretungserklärung konnte nicht heruntergeladen werden: [${error.status}] ${error.error}`);
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
