import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { faCircleRight } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'cura-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  providers: [ApiService],
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  faCircleRight = faCircleRight;
  @Output() signUpCompleted = new EventEmitter();

  constructor(private apiService: ApiService, private formBuilder: FormBuilder) {
    this.signupForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      companyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    });
  }

  public signupForm: FormGroup;

  handleSignup(): void {
    this.apiService.signup(this.signupForm.value).subscribe({
      complete: () => {
        console.log('Signup completed');
        this.signUpCompleted.emit();
      },
    });
  }
}
