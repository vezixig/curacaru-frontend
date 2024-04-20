import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Toast, ToastrService } from 'ngx-toastr';
import { EMPTY, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor(public toastrService: ToastrService) {}

  handleError(error: any) {
    if (error instanceof HttpErrorResponse) {
      const httpError = <HttpErrorResponse>error;
      this.toastrService.error(`${this.getErrorTitle(httpError.status)}: ${error.error}`, 'Das hat leider nicht geklappt');
    } else {
      this.toastrService.error(`Das hat leider nicht geklappt`);
    }
    return EMPTY;
  }

  private getErrorTitle(status: number) {
    switch (status) {
      case 400:
        return 'Fehlerhafte Anfrage';
      case 401:
        return 'Unerlaubter Zugriff';
      case 403:
        return 'Zugriff verweigert';
      case 404:
        return 'Nicht gefunden';
      case 500:
        return 'Verarbeitungsfehler';
      default:
        return 'Unbekannter Fehler';
    }
  }
}
