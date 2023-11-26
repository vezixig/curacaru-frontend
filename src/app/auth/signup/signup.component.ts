import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormBuilder,
} from '@angular/forms';
import { faCircleRight } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'cura-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  faCircleRight = faCircleRight;
  @Output() signUpCompleted = new EventEmitter();

  constructor(
    private formBuilder: FormBuilder,
    private httpClient: HttpClient
  ) {
    this.signupForm = this.formBuilder.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(150),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(150),
        ],
      ],
      companyName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(150),
        ],
      ],
    });
  }

  public signupForm: FormGroup;

  handleSignup(): void {
    this.httpClient
      .post('https://localhost:7077/signup', this.signupForm.value)
      .subscribe({
        complete: () => {
          console.log('Signup completed');
          this.signUpCompleted.emit();
        },
      });
  }
}
