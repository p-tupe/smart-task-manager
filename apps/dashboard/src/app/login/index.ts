import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  loadUserFromSession,
  loginUser,
  UserState,
} from '../../store/user.module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class Login {
  private router = inject(Router);

  username: string = '';
  password: string = '';
  userState$: Observable<UserState>;

  constructor(private store: Store<{ user: UserState }>) {
    this.userState$ = this.store.select('user');

    this.userState$.subscribe((state) => {
      if (state.user) this.router.navigate(['/dashboard']);
    });
  }

  ngOnInit() {
    this.store.dispatch(loadUserFromSession());
  }

  onLogin() {
    this.store.dispatch(
      loginUser({
        username: this.username,
        password: this.password,
      })
    );
  }
}
