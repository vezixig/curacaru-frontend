import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'cura-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  imports: [CommonModule],
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  constructor(private auth: AuthService) {}

  handleLogin(): void {
    this.auth.loginWithRedirect();
  }
}
