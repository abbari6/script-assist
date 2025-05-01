import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './enums/task-status.enum';
import { CreateTaskCommand } from './commands/create-task.command';
import { UpdateTaskCommand } from './commands/update-task.command';
import { RemoveTaskCommand } from './commands/remove-task.command';
import { UpdateTaskStatusCommand } from './commands/update-task-status.command';
import { BatchProcessTasksCommand } from './commands/batch-process-tasks.command';
import { GetTaskQuery } from './queries/get-task.query';
import { GetTasksQuery } from './queries/get-tasks.query';
import { GetTasksByStatusQuery } from './queries/get-tasks-by-status.query';
import { GetTaskStatsQuery } from './queries/get-task-stats.query';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    return this.commandBus.execute(new CreateTaskCommand(createTaskDto));
  }

  async findAll(
    userId: string,
    filters: { status?: TaskStatus; priority?: string },
    page = 1,
    limit = 10,
  ): Promise<{ data: Task[]; total: number }> {
    return this.queryBus.execute(new GetTasksQuery(userId, filters, page, limit));
  }

  async findOne(id: string): Promise<Task> {
    return this.queryBus.execute(new GetTaskQuery(id));
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    return this.commandBus.execute(new UpdateTaskCommand(id, updateTaskDto));
  }

  async remove(id: string): Promise<void> {
    return this.commandBus.execute(new RemoveTaskCommand(id));
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.queryBus.execute(new GetTasksByStatusQuery(status));
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.commandBus.execute(new UpdateTaskStatusCommand(id, status));
  }

  async getStats(userId: string) {
    return this.queryBus.execute(new GetTaskStatsQuery(userId));
  }

  async batchProcess(userId: string, taskIds: string[], action: 'complete' | 'delete') {
    return this.commandBus.execute(new BatchProcessTasksCommand(userId, taskIds, action));
  }
}
