import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { createAction, createReducer, on, props } from '@ngrx/store';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { User } from '@smart-task-manager/data';

export interface UserState {
  user: User | null;
  access_token: string;
  loading: boolean;
  error: string | null;
}

export const initialUserState: UserState = {
  user: null,
  access_token: '',
  loading: false,
  error: null,
};

export const loginUser = createAction(
  '[User] Login',
  props<{ username: string; password: string }>()
);

export const logoutUser = createAction('[User] Logout');

export const loginUserSuccess = createAction(
  '[User] Login Success',
  props<{ user: User }>()
);

export const loginUserFailure = createAction(
  '[User] Login Failure',
  props<{ error: string }>()
);

export const loadUserFromSession = createAction('[User] Load From Session');

export const loadUserFromSessionSuccess = createAction(
  '[User] Load From Session Success',
  props<{ user: User }>()
);

export const userReducer = createReducer(
  initialUserState,

  on(loginUser, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(logoutUser, (_state) => ({ ...initialUserState })),

  on(loginUserSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null,
  })),

  on(loginUserFailure, (state, { error }) => ({
    ...state,
    user: null,
    loading: false,
    error,
  })),

  on(loadUserFromSession, (state) => ({
    ...state,
    loading: true,
  })),

  on(loadUserFromSessionSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null,
  }))
);

@Injectable()
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/login`, {
        username,
        password,
      })
      .pipe(
        map((response) => {
          this.setUserSession(response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    sessionStorage.removeItem('user');
    logoutUser();
  }

  private setUserSession(user: User): void {
    sessionStorage.setItem('user', JSON.stringify(user));
    if ('access_token' in user) {
      sessionStorage.setItem('access_token', user.access_token as string);
    }
  }

  getUserSession(): User | null {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch (error) {
        console.error('Error parsing user session:', error);
        sessionStorage.removeItem('user');
      }
    }
    return null;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    }

    console.error(error);

    return throwError(() => new Error(errorMessage));
  }
}

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginUser),
      mergeMap((action) =>
        this.authService.login(action.username, action.password).pipe(
          map((user: User) => {
            return loginUserSuccess({ user });
          }),
          catchError((error) =>
            of(
              loginUserFailure({
                error: error.message || 'Login failed',
              })
            )
          )
        )
      )
    )
  );

  loadUserFromSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUserFromSession),
      map(() => {
        const user = this.authService.getUserSession();
        if (user) {
          return loadUserFromSessionSuccess({ user });
        } else {
          return logoutUser();
        }
      })
    )
  );
}
