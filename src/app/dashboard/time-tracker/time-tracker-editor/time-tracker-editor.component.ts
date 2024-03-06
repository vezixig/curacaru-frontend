import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '@curacaru/services';
import { Observable, Subject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { InputComponent } from '@curacaru/shared/input/input.component';

@Component({
  providers: [ApiService],
  selector: 'cura-time-tracker-editor',
  standalone: true,
  templateUrl: './time-tracker-editor.component.html',
  imports: [ReactiveFormsModule, InputComponent],
})
export class TimeTrackerEditorComponent {
  refreshSubject = new Subject();

  reportForm: FormGroup;

  private apiService = inject(ApiService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  public isNew = false;

  constructor() {
    this.reportForm = this.formBuilder.group({
      employeeId: [''],
      employeeName: [''],
    });

    this.isNew = this.router.url.endsWith('new');
    // if (!this.isNew) {
    //   this.apiService.
    // }
  }

  public onSave() {
    console.log('Save');
  }
}
