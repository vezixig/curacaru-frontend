import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  imports: [NgxSkeletonLoaderModule, CommonModule, ReactiveFormsModule],
  selector: 'cura-input',
  standalone: true,
  templateUrl: './input.component.html',
})
export class InputComponent {
  @Input() form!: FormGroup;
  @Input() key!: string;
  @Input() isLoading = true;
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() info: string = '';
  @Input() prefix: string = '';

  @Output() change = new EventEmitter();
}
