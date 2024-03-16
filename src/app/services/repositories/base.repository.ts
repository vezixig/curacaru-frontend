import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

/**
 * Base repository class
 */
export class BaseRepository {
  protected readonly apiUrl = environment.auth0.api.serverUrl;
  protected readonly client = inject(HttpClient);
}
