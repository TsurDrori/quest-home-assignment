import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
// Import provideHttpClient and potentially interceptors or other features
import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  // providers array lists services and configuration functions for the application's root injector
  providers: [
    // Standard setup for Zone.js change detection
    provideZoneChangeDetection({ eventCoalescing: true }),

    // --- HttpClient Configuration ---
    // provideHttpClient() registers the necessary providers for HttpClient injection.
    // withFetch() (optional) configures HttpClient to use the browser's fetch API internally.
    // withInterceptorsFromDi() (optional) allows traditional class-based interceptors to be used if needed.
    provideHttpClient(withFetch(), withInterceptorsFromDi()),

    // If you were using class-based interceptors, you would provide them here too:
    // { provide: HTTP_INTERCEPTORS, useClass: MyInterceptor, multi: true },
  ],
};
