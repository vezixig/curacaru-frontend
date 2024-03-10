import { AfterViewInit, Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEraser } from '@fortawesome/free-solid-svg-icons';
import { Subject, fromEvent, startWith, takeUntil } from 'rxjs';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'cura-signature',
  standalone: true,
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.scss'],
  imports: [FontAwesomeModule],
})
export class Signature implements AfterViewInit {
  @ViewChild('canvas') canvasElement!: ElementRef;

  signaturePad!: SignaturePad;
  private readonly $onDestroy = new Subject();
  canvasWidth = signal(0);
  faEraser = faEraser;

  ngAfterViewInit(): void {
    this.signaturePad = new SignaturePad(this.canvasElement.nativeElement);

    fromEvent(window, 'resize')
      .pipe(startWith([]), takeUntil(this.$onDestroy))
      .subscribe(() => {
        this.canvasWidth.set(this.canvasElement.nativeElement.parentElement.offsetWidth);
      });
  }

  isEmpty(): boolean {
    return this.signaturePad.isEmpty();
  }

  toDataURL(): any {
    return this.signaturePad.toDataURL();
  }
}
