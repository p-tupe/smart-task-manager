import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { logoutUser, UserState } from '../../store/user.module';
import {
  loadTasks,
  createTask,
  updateTask,
  deleteTask,
  TaskState,
} from '../../store/task.module';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  CreateTaskDto,
  Task,
  UpdateTaskDto,
  User,
} from '@smart-task-manager/data';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class Dashboard implements OnInit {
  private router = inject(Router);

  userState$: Observable<UserState>;
  taskState$: Observable<TaskState>;

  theme: 'Dark' | 'Light' = 'Light';
  user: User | null = null;
  isProfileShown = false;
  selectedTask: Task | null = null;
  tasks: Task[] | [] = [];
  // FIXME - task data was readonly on edit for some reason
  selectedTaskTitle: Task['title'] = '';
  selectedTaskDueDate: Task['dueDate'] = '';
  selectedTaskDescription: Task['description'] = '';
  selectedTaskStatus: Task['status'] = 'pending';

  constructor(private store: Store<{ user: UserState; task: TaskState }>) {
    this.userState$ = this.store.select('user');
    this.taskState$ = this.store.select('task');

    this.userState$.subscribe((state) => {
      if (!state.user) this.router.navigate(['/']);
      else this.user = state.user;
    });

    this.taskState$.subscribe((state) => {
      if (state) {
        this.tasks = state.tasks || [];
      }
    });
  }

  ngOnInit() {
    this.store.dispatch(loadTasks());
  }

  onThemeChange() {
    const theme = document.documentElement.getAttribute('data-mode');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-mode', 'light');
    } else {
      document.documentElement.setAttribute('data-mode', 'dark');
    }
  }

  onLogout() {
    sessionStorage.removeItem('user');
    this.store.dispatch(logoutUser());
  }

  onShowProfile() {
    this.isProfileShown = true;
  }

  onHideProfile() {
    this.isProfileShown = false;
  }

  onShowTaskForm(t: Task | null) {
    if (t) {
      this.selectedTaskTitle = t.title;
      this.selectedTaskDueDate = t.dueDate;
      this.selectedTaskDescription = t.description;
      this.selectedTaskStatus = t.status;
      this.selectedTask = t;
    } else {
      this.selectedTaskTitle = '';
      this.selectedTaskDueDate = '';
      this.selectedTaskDescription = '';
      this.selectedTaskStatus = 'pending';
      this.selectedTask = {} as Task;
    }
  }

  onHideTaskForm() {
    this.selectedTask = null;
  }

  onCreateOrUpdateTask() {
    if (!this.selectedTask) return;

    if ('id' in this.selectedTask) {
      const updateDto: UpdateTaskDto = {
        status: this.selectedTaskStatus,
        title: this.selectedTaskTitle,
        dueDate: this.selectedTaskDueDate,
        description: this.selectedTaskDescription,
      };
      this.store.dispatch(
        updateTask({ id: this.selectedTask.id, task: updateDto })
      );
      this.onHideTaskForm();
    } else {
      const createDto: CreateTaskDto = {
        status: this.selectedTaskStatus,
        title: this.selectedTaskTitle,
        dueDate: this.selectedTaskDueDate,
        description: this.selectedTaskDescription,
      };
      this.store.dispatch(createTask({ task: createDto }));
      this.onHideTaskForm();
    }
  }

  onDeleteTask(id: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.store.dispatch(deleteTask({ id }));
      this.selectedTask = null;
    }
  }
}
