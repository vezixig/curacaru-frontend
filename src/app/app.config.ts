import { ApplicationConfig, DEFAULT_CURRENCY_CODE, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { ManagerGuard } from './guards/manger.guard';

export const appConfig: ApplicationConfig = {
  providers: [
    ManagerGuard,
    { provide: LOCALE_ID, useValue: 'de-DE' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptor,
      multi: true,
    },
    importProvidersFrom(
      AuthModule.forRoot({
        ...environment.auth0,
        useRefreshTokens: true,
        cacheLocation: 'localstorage',
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
