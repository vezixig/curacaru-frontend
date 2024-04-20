import { Injectable, computed, signal } from '@angular/core';
import { fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScreenService {
  public innerWidth = signal<number>(window.innerWidth);
  public isMobile = computed(() => this.innerWidth() < 768);

  constructor() {
    fromEvent(window, 'resize').subscribe(() => this.innerWidth.set(window.innerWidth));
  }
}
