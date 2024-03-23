import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEraser } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { Subject, delay, fromEvent, startWith, takeUntil } from 'rxjs';
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
  @ViewChild('submitButtonHorizontal') submitButtonHorizontalElement!: ElementRef;
  @ViewChild('submitButtonVertical') submitButtonVerticalElement!: ElementRef;
  @Input() maxHeight = 250;
  @Input() signatureName = '';
  @Output() signatureTaken = new EventEmitter<string>();

  private readonly toastrService = inject(ToastrService);

  signaturePad!: SignaturePad;
  private readonly $onDestroy = new Subject();
  canvasWidth = signal(0);
  canvasHeight = signal(0);
  isHorizontal = signal(false);
  faEraser = faEraser;

  thrown = false;

  ngAfterViewInit(): void {
    this.signaturePad = new SignaturePad(this.canvasElement.nativeElement);

    fromEvent(window, 'resize')
      .pipe(startWith([]), takeUntil(this.$onDestroy), delay(100))
      .subscribe(() => {
        let size = this.canvasElement.nativeElement.parentElement.getBoundingClientRect();

        let width = size.width;
        let height = size.height;
        this.isHorizontal.set(width > 450);

        width -= this.isHorizontal() ? 105 : 0;
        height -= this.isHorizontal() ? 0 : 40;

        this.canvasHeight.set(height);
        this.canvasWidth.set(width);
      });
  }

  onAcceptSignature() {
    if (this.signaturePad.isEmpty()) {
      this.toastrService.warning('Bitte unterschreibe erst bevor du fortfährst');
      return;
    }

    this.signatureTaken.emit(this.signaturePad.toDataURL());
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
