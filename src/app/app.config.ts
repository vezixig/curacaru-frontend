import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptor,
      multi: true,
    },
    importProvidersFrom(
      AuthModule.forRoot({
        ...environment.auth0,
        authorizationParams: { redirect_uri: environment.auth0.callbackUri },
        httpInterceptor: {
          allowedList: [`${environment.auth0.api.serverUrl}/*`],
        },
      })
    ),
  ],
};
