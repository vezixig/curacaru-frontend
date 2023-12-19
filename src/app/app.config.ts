import { ApplicationConfig, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' },
    provideRouter(routes),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptor,
      multi: true,
    },
    importProvidersFrom(
      AuthModule.forRoot({
        ...environment.auth0,
        authorizationParams: {
          redirect_uri: environment.auth0.callbackUri,
          audience: environment.auth0.authorizationParams.audience,
        },
        httpInterceptor: {
          allowedList: [`${environment.auth0.api.serverUrl}/*`],
        },
      })
    ),
    provideAnimations(),
    provideToastr(),
  ],
};
