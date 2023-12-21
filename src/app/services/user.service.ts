import { Injectable } from '@angular/core';
import { UserEmployee } from '../models/user-employee.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user?: UserEmployee;
}
