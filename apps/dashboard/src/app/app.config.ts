import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { AuthService, UserEffects, userReducer } from '../store/user.module';
import { TaskService, TaskEffects, taskReducer } from '../store/task.module';

export const appConfig: ApplicationConfig = {
  providers: [
    AuthService,
    TaskService,
    provideHttpClient(),
    provideStore({ user: userReducer, task: taskReducer }),
    provideEffects([UserEffects, TaskEffects]),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
  ],
};
