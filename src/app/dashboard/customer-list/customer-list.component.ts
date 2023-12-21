import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CustomerListEntry } from '../../models/customer-list-entry.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalConfirm } from '../../modals/confirm-modal/confirm-modal.component';
import { RouterModule } from '@angular/router';
import { Subscription, first } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { UserService } from '../../services/user.service';

@Component({
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  selector: 'cura-customer-list',
  standalone: true,
  templateUrl: './customer-list.component.html',
})
export class CustomerListComponent implements OnDestroy, OnInit {
  public customers: CustomerListEntry[] = [];
  public faGear = faGear;
  public faTrashCan = faTrashCan;
  public isManager: boolean = false;

  private httpSubscription: Subscription | undefined = undefined;

  constructor(private _httpClient: HttpClient, private _modalService: NgbModal, private _toastr: ToastrService, private _userService: UserService) {}

  ngOnDestroy(): void {
    this.httpSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.isManager = this._userService.user?.isManager ?? false;
    this._httpClient
      .get<CustomerListEntry[]>('https://localhost:7077/customer/list')
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.customers = result;
        },
        error: (error) => {
          this._toastr.error('Kundenliste konnte nicht abgerufen werden: ' + error.message);
        },
      });
  }

  public handleDelete(customer: CustomerListEntry) {
    const modalRef = this._modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => {
      this.deleteEmployee(customer);
    });
    modalRef.componentInstance.title = 'Kunden löschen';
    modalRef.componentInstance.text = `Soll ${customer.firstName} ${customer.lastName} wirklich gelöscht werden?`;
  }

  private deleteEmployee(customer: CustomerListEntry) {
    this.httpSubscription?.unsubscribe();

    this.httpSubscription = this._httpClient.delete(`https://localhost:7077/customer/${customer.id}`).subscribe({
      complete: () => {
        this._toastr.success(`${customer.firstName} ${customer.lastName} wurde gelöscht.`);
        this.customers = this.customers.filter((e) => e.id !== customer.id);
      },
      error: (error) => {
        this._toastr.error('Mitarbeiter konnte nicht gelöscht werden: ' + error.message);
      },
    });
  }
}
