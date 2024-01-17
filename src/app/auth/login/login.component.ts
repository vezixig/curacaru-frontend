
import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'cura-login',
  standalone: true,
  templateUrl: './login.component.html',
  imports: [],
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  constructor(private auth: AuthService) {}

  handleLogin(): void {
    this.auth.loginWithRedirect();
  }
}
