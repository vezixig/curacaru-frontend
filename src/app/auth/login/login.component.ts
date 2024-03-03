import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'cura-login',
  standalone: true,
  templateUrl: './login.component.html',
  imports: [NgOptimizedImage],
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  constructor(private auth: AuthService) {}

  handleLogin(): void {
    this.auth.loginWithRedirect();
  }
}
