import { AfterViewInit, Component, ElementRef, Input, ViewChild, signal } from '@angular/core';
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
  @Input() maxHeight = 250;
  @Input() signingName = '';

  signaturePad!: SignaturePad;
  private readonly $onDestroy = new Subject();
  canvasWidth = signal(0);
  canvasHeight = signal(0);
  isHorizontal = signal(false);
  faEraser = faEraser;

  ngAfterViewInit(): void {
    this.signaturePad = new SignaturePad(this.canvasElement.nativeElement);

    fromEvent(window, 'resize')
      .pipe(startWith([]), takeUntil(this.$onDestroy))
      .subscribe(() => {
        let width = this.canvasElement.nativeElement.parentElement.offsetWidth;
        let height = this.canvasElement.nativeElement.parentElement.offsetHeight;
        this.isHorizontal.set(width > 450);

        width -= this.isHorizontal() ? 105 : 0;
        height -= this.isHorizontal() ? 0 : 40;

        this.canvasHeight.set(height);
        this.canvasWidth.set(width);
      });
  }

  clear(): void {
    this.signaturePad.clear();
  }

  isEmpty(): boolean {
    return this.signaturePad.isEmpty();
  }

  toDataURL(): any {
    return this.signaturePad.toDataURL();
  }
}
