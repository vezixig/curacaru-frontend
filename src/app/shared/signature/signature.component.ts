import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEraser } from '@fortawesome/free-solid-svg-icons';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
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
export class SignatureComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasElement!: ElementRef;
  @ViewChild('submitButtonHorizontal') submitButtonHorizontalElement!: ElementRef;
  @ViewChild('submitButtonVertical') submitButtonVerticalElement!: ElementRef;
  @Input() maxHeight = 250;
  @Input() signatureName = '';
  @Input() title = 'Unterschrift';
  @Output() signatureTaken = new EventEmitter<string>();

  private readonly toastrService = inject(ToastrService);
  private readonly offCanvasService = inject(NgbOffcanvas);

  signaturePad!: SignaturePad;
  private readonly $onDestroy = new Subject();
  canvasWidth = signal(0);
  canvasHeight = signal(0);
  canvasLeft = signal('0px');
  toolOffset = signal('0px;');
  isHorizontal = signal(false);
  faEraser = faEraser;

  thrown = false;

  ngAfterViewInit(): void {
    this.signaturePad = new SignaturePad(this.canvasElement.nativeElement);

    // prevent loupe (magnifier) on ios to open while signing
    this.canvasElement.nativeElement.addEventListener('touchstart', (e: any) => {
      e.preventDefault(), { passive: false };
    });

    fromEvent(window, 'resize')
      .pipe(startWith([]), takeUntil(this.$onDestroy), delay(100))
      .subscribe(() => {
        let size = this.canvasElement.nativeElement.parentElement.getBoundingClientRect();

        let width = size.width;
        let height = size.height;
        this.isHorizontal.set(width > 450);

        width -= this.isHorizontal() ? 105 : 0;
        height -= this.isHorizontal() ? 0 : 40;

        this.canvasLeft.set((this.isHorizontal() ? 105 : 0).toString() + 'px');
        // this.toolOffset.set(('this.isHorizontal() ? 100 : 0).toString() + 'px');
        this.canvasHeight.set(height);
        this.canvasWidth.set(width);
      });
  }

  ngOnDestroy(): void {
    this.canvasElement.nativeElement.removeEventListener('touchstart', (e: any) => {
      e.preventDefault(), { passive: false };
    });
  }

  onDismiss() {
    this.offCanvasService.dismiss();
  }

  onAcceptSignature() {
    if (this.signaturePad.isEmpty()) {
      this.toastrService.warning('Bitte unterschreibe erst bevor du fortfährst');
      return;
    }

    this.signatureTaken.emit(this.signaturePad.toDataURL());
    this.offCanvasService.dismiss();
  }

  preventDefault(e: Event) {
    e = e || window.event;
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.returnValue = false;
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
