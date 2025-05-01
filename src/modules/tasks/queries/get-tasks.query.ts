import { TaskStatus } from '../enums/task-status.enum';

export class GetTasksQuery {
  constructor(
    public readonly userId: string,
    public readonly filters: { status?: TaskStatus; priority?: string },
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}
