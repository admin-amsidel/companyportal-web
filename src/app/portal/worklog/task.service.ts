/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../portal.config';
import { MyTask, TaskBody, TaskCustomer, TaskLogs, TaskStatus, WorkTask } from './worklog.models';

const TASKS = `${API_BASE}/api/tasks`;

/** Tasks (see TaskController in companyportal-backend): mine for everyone; the rest for owners and admins. */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);

  mine(): Observable<MyTask[]> {
    return this.http.get<MyTask[]>(`${TASKS}/mine`);
  }

  /** The customers a task may be for (no Customers menu needed). */
  customers(): Observable<TaskCustomer[]> {
    return this.http.get<TaskCustomer[]>(`${TASKS}/customers`);
  }

  list(status: TaskStatus | null): Observable<WorkTask[]> {
    return this.http.get<WorkTask[]>(TASKS, { params: status ? { status } : {} });
  }

  /** The task's page: the task and every work log entry against it. */
  logs(id: number): Observable<TaskLogs> {
    return this.http.get<TaskLogs>(`${TASKS}/${id}/logs`);
  }

  /** What deleting the task would remove: its work log entries, hours and goal items. Owners and admins only. */
  deleteCheck(id: number): Observable<TaskDeleteCheck> {
    return this.http.get<TaskDeleteCheck>(`${TASKS}/${id}/delete-check`);
  }

  /** Deletes the task for good, with its work log entries and goal items (test data). Owners and admins only. */
  delete(id: number): Observable<TaskDeleteCheck> {
    return this.http.delete<TaskDeleteCheck>(`${TASKS}/${id}`);
  }

  save(body: TaskBody, id?: number): Observable<WorkTask> {
    return id ? this.http.put<WorkTask>(`${TASKS}/${id}`, body) : this.http.post<WorkTask>(TASKS, body);
  }
}

/** GET /api/tasks/{id}/delete-check and the answer to DELETE: what goes with the task. */
export interface TaskDeleteCheck {
  id: number;
  code: string;
  title: string;
  logEntries: number;
  hours: number;
  loggedBy: number;
  assignees: number;
  goalItems: number;
}
