import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Employee, UserEmployee } from '@curacaru/models';
import { ApiService, UserService } from '@curacaru/services';
import { InputComponent } from '@curacaru/shared/input/input.component';
import { ToastrService } from 'ngx-toastr';
import { Observable, map, mergeMap, tap } from 'rxjs';
import { ProfileRepository } from './profile.repository';
import { faL } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, InputComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  userService = inject(UserService);
  apiService = inject(ApiService);
  formBuilder = inject(FormBuilder);
  toastrService = inject(ToastrService);
  profileRepository = inject(ProfileRepository);

  model$: Observable<{ employee: Employee; user: UserEmployee }>;
  employeeForm: FormGroup;
  isSaving = signal(false);
  isSending = signal(false);

  constructor() {
    this.employeeForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      id: [''],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      phoneNumber: [''],
    });

    this.model$ = this.userService.user$.pipe(
      mergeMap((user) => this.apiService.getEmployee(user.id).pipe(map((employee) => ({ employee: employee, user: user })))),
      tap((model) => this.employeeForm.patchValue(model.employee))
    );
  }

  onSave() {
    if (this.employeeForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.profileRepository.updateProfile(this.employeeForm.value).subscribe({
      next: () => {
        this.toastrService.success('Dein Profil wurde aktualisiert.');
        this.isSaving.set(false);
      },
      error: (error) => {
        this.toastrService.error('Dein Profil konnte nicht aktualisiert werden. Bitte versuche es später erneut.');
        this.isSaving.set(false);
      },
    });
  }

  onResetPassword() {
    this.isSending.set(true);
    this.profileRepository.changePassword().subscribe({
      next: () => {
        this.toastrService.success('Eine E-Mail zum Zurücksetzen des Passworts wurde an deine E-Mail-Adresse gesendet.');
        this.isSending.set(false);
      },
      error: (error) => {
        this.toastrService.error('Das Passwort konnte nicht zurückgesetzt werden. Bitte versuche es später erneut.');
        this.isSending.set(false);
      },
    });
  }
}
