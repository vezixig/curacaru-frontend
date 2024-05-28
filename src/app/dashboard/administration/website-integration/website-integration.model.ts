import { UUID } from 'angular2-uuid';

export interface WebsiteIntegrationModel {
  id: UUID;
  color: string;
  fontSize: number;
  isRounded: boolean;
}
