import { TaskStatus } from '../enums/task-status.enum';

export class UpdateTaskStatusCommand {
  constructor(
    public readonly id: string,
    public readonly status: TaskStatus,
  ) {}
}
