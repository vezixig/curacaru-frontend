import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthModule } from '@auth0/auth0-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(
      AuthModule.forRoot({
        ...environment.auth0,
        authorizationParams: { redirect_uri: environment.auth0.callbackUri },
      })
    ),
  ],
};
