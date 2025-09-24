import { Route } from '@angular/router';
import { Login } from './login';
import { Dashboard } from './dashboard';

export const appRoutes: Route[] = [
  { path: '', component: Login },
  { path: 'dashboard', component: Dashboard },
];
