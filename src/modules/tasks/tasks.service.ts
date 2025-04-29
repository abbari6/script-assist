import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskStatus } from './enums/task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private readonly dataSource: DataSource, // For transactions
    @InjectQueue('task-processing')
    private taskQueue: Queue,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    return await this.dataSource.transaction(async manager => {
      const task = manager.create(Task, createTaskDto);
      const savedTask = await manager.save(task);

      await this.taskQueue.add('task-status-update', {
        taskId: savedTask.id,
        status: savedTask.status,
      });

      return savedTask;
    });
  }

  async findAll(
    userId: string,
    filters: { status?: TaskStatus; priority?: string },
    page = 1,
    limit = 10,
  ): Promise<{ data: Task[]; total: number }> {
    const queryBuilder = this.tasksRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });

    if (filters.status) {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority: filters.priority });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    return await this.dataSource.transaction(async manager => {
      const task = await this.findOne(id);

      const originalStatus = task.status;

      Object.assign(task, updateTaskDto);

      const updatedTask = await manager.save(task);

      if (originalStatus !== updatedTask.status) {
        await this.taskQueue.add('task-status-update', {
          taskId: updatedTask.id,
          status: updatedTask.status,
        });
      }

      return updatedTask;
    });
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.delete(task.id);
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.tasksRepository.find({ where: { status } });
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const task = await this.findOne(id);
    task.status = status;
    return this.tasksRepository.save(task);
  }

  async getStats(userId: string) {
    const result = await this.tasksRepository
      .createQueryBuilder('task')
      .select('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE task.status = :completed)`, 'completed')
      .addSelect(`COUNT(*) FILTER (WHERE task.status = :inProgress)`, 'inProgress')
      .addSelect(`COUNT(*) FILTER (WHERE task.status = :pending)`, 'pending')
      .addSelect(`COUNT(*) FILTER (WHERE task.priority = :highPriority)`, 'highPriority')
      .where('task.userId = :userId', { userId })
      .setParameters({
        completed: TaskStatus.COMPLETED,
        inProgress: TaskStatus.IN_PROGRESS,
        pending: TaskStatus.PENDING,
        highPriority: 'HIGH',
      })
      .getRawOne();

    return result;
  }

  async batchProcess(userId: string, taskIds: string[], action: string) {
    const tasks = await this.tasksRepository.find({
      where: { userId, id: In(taskIds) },
    });

    if (tasks.length !== taskIds.length) {
      throw new NotFoundException('Some tasks not found or unauthorized');
    }

    switch (action) {
      case 'complete':
        await this.tasksRepository
          .createQueryBuilder()
          .update(Task)
          .set({ status: TaskStatus.COMPLETED })
          .whereInIds(taskIds)
          .execute();
        break;

      case 'delete':
        await this.tasksRepository
          .createQueryBuilder()
          .delete()
          .from(Task)
          .whereInIds(taskIds)
          .execute();
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return { message: `Batch ${action} completed successfully.` };
  }
}
