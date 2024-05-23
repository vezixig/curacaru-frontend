import { BaseRepository } from '@curacaru/services/repositories/base.repository';
import { WebsiteIntegrationModel } from './website-integration.model';
import { Injectable } from '@angular/core';

/**
 * Repository for website integration related requests
 */
@Injectable({
  providedIn: 'root',
})
export class WebsiteIntegrationRepository extends BaseRepository {
  /**
   * Gets the website integration data
   * @returns the website integration data or null
   */
  getWebsiteIntegration() {
    return this.client.get<WebsiteIntegrationModel | null>(`${this.apiUrl}/contact-forms`);
  }

  /**
   * Activates the website integration
   * @returns an empty observable
   */
  activateWebsiteIntegration() {
    return this.client.post(`${this.apiUrl}/contact-forms/activate`, {});
  }

  /**
   * Updates the website integration
   * @returns an empty observable
   */
  updateWebsiteIntegration(model: WebsiteIntegrationModel) {
    return this.client.put(`${this.apiUrl}/contact-forms`, model);
  }
}
