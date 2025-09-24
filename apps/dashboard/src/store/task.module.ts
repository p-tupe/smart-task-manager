import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { createAction, createReducer, on, props, Store } from '@ngrx/store';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Task, CreateTaskDto, UpdateTaskDto } from '@smart-task-manager/data';
import { UserState } from './user.module';

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export const initialTaskState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

export const loadTasks = createAction('[Task] Load Tasks');

export const loadTasksSuccess = createAction(
  '[Task] Load Tasks Success',
  props<{ tasks: Task[] }>()
);

export const loadTasksFailure = createAction(
  '[Task] Load Tasks Failure',
  props<{ error: string }>()
);

export const createTask = createAction(
  '[Task] Create Task',
  props<{ task: CreateTaskDto }>()
);

export const createTaskSuccess = createAction(
  '[Task] Create Task Success',
  props<{ task: Task }>()
);

export const createTaskFailure = createAction(
  '[Task] Create Task Failure',
  props<{ error: string }>()
);

export const updateTask = createAction(
  '[Task] Update Task',
  props<{ id: number; task: UpdateTaskDto }>()
);

export const updateTaskSuccess = createAction(
  '[Task] Update Task Success',
  props<{ task: Task }>()
);

export const updateTaskFailure = createAction(
  '[Task] Update Task Failure',
  props<{ error: string }>()
);

export const deleteTask = createAction(
  '[Task] Delete Task',
  props<{ id: number }>()
);

export const deleteTaskSuccess = createAction(
  '[Task] Delete Task Success',
  props<{ id: number }>()
);

export const deleteTaskFailure = createAction(
  '[Task] Delete Task Failure',
  props<{ error: string }>()
);

export const taskReducer = createReducer(
  initialTaskState,

  on(loadTasks, createTask, updateTask, deleteTask, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(loadTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks,
    loading: false,
    error: null,
  })),

  on(createTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: [...state.tasks, task],
    loading: false,
    error: null,
  })),

  on(updateTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    loading: false,
    error: null,
  })),

  on(deleteTaskSuccess, (state, { id }) => ({
    ...state,
    tasks: state.tasks.filter((t) => t.id !== id),
    loading: false,
    error: null,
  })),

  on(
    loadTasksFailure,
    createTaskFailure,
    updateTaskFailure,
    deleteTaskFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })
  )
);

@Injectable()
export class TaskService {
  private apiUrl = 'http://localhost:3000/api/task';

  private access_token = '';

  userState$: Observable<UserState>;

  constructor(
    private http: HttpClient,
    private store: Store<{ user: UserState }>
  ) {
    this.userState$ = this.store.select('user');

    this.userState$.subscribe((state) => {
      if (state.user) {
        const access_token = sessionStorage.getItem('access_token');
        if (access_token) this.access_token = access_token;
        console.log('Setting access token: ', access_token);
      } else this.access_token = '';
    });
  }

  getTasks(): Observable<Task[]> {
    return this.http
      .get<Task[]>(this.apiUrl, {
        headers: {
          Authorization: 'Bearer ' + this.access_token,
        },
      })
      .pipe(catchError(this.handleError));
  }

  createTask(task: CreateTaskDto): Observable<Task> {
    return this.http
      .post<Task>(this.apiUrl, task, {
        headers: {
          Authorization: 'Bearer ' + this.access_token,
        },
      })
      .pipe(catchError(this.handleError));
  }

  updateTask(id: number, task: UpdateTaskDto): Observable<Task> {
    return this.http
      .put<Task>(`${this.apiUrl}/${id}`, task, {
        headers: {
          Authorization: 'Bearer ' + this.access_token,
        },
      })
      .pipe(catchError(this.handleError));
  }

  deleteTask(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`, {
        headers: {
          Authorization: 'Bearer ' + this.access_token,
        },
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error: ${error.message}`;
    }

    console.error(error);
    return throwError(() => new Error(errorMessage));
  }
}

@Injectable()
export class TaskEffects {
  private actions$ = inject(Actions);
  private taskService = inject(TaskService);

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTasks),
      mergeMap(() =>
        this.taskService.getTasks().pipe(
          map((tasks: Task[]) => loadTasksSuccess({ tasks })),
          catchError((error) =>
            of(
              loadTasksFailure({
                error: error.message || 'Failed to load tasks',
              })
            )
          )
        )
      )
    )
  );

  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createTask),
      mergeMap((action) =>
        this.taskService.createTask(action.task).pipe(
          map((task: Task) => createTaskSuccess({ task })),
          catchError((error) =>
            of(
              createTaskFailure({
                error: error.message || 'Failed to create task',
              })
            )
          )
        )
      )
    )
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateTask),
      mergeMap((action) =>
        this.taskService.updateTask(action.id, action.task).pipe(
          map((task: Task) => updateTaskSuccess({ task })),
          catchError((error) =>
            of(
              updateTaskFailure({
                error: error.message || 'Failed to update task',
              })
            )
          )
        )
      )
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteTask),
      mergeMap((action) =>
        this.taskService.deleteTask(action.id).pipe(
          map(() => deleteTaskSuccess({ id: action.id })),
          catchError((error) =>
            of(
              deleteTaskFailure({
                error: error.message || 'Failed to delete task',
              })
            )
          )
        )
      )
    )
  );
}
