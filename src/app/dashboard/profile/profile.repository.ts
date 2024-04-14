import { Injectable } from '@angular/core';
import { BaseRepository } from '../../services/repositories/base.repository';
import { Profile } from '@curacaru/models/profile.model';

/**
 * Repository for profile related requests
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileRepository extends BaseRepository {
  updateProfile(profile: Profile) {
    return this.client.put(`${this.apiUrl}/employee/profile`, profile);
  }

  changePassword() {
    return this.client.post(`${this.apiUrl}/employee/change-password`, {});
  }
}
