import { TaskStatus } from '../enums/task-status.enum';

export class GetTasksByStatusQuery {
  constructor(public readonly status: TaskStatus) {}
}
