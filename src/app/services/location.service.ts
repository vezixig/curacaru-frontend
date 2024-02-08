import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private isAppleDevice = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('IPHONE') >= 0 || navigator.userAgent.toUpperCase().indexOf('IPAD') >= 0;

  public openLocationLink(location: string) {
    location = location.replace(' ', '+');

    if (this.isAppleDevice) {
      window.open(`https://maps.apple.com/?q=${location}`);
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${location}`);
    }
  }
}
