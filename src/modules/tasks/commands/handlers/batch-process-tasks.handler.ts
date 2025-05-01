import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BatchProcessTasksCommand } from '../batch-process-tasks.command';
import { Task } from '../../entities/task.entity';
import { TaskStatus } from '../../enums/task-status.enum';

@CommandHandler(BatchProcessTasksCommand)
export class BatchProcessTasksHandler implements ICommandHandler<BatchProcessTasksCommand> {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async execute(command: BatchProcessTasksCommand): Promise<{ message: string }> {
    const { userId, taskIds, action } = command;
    
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
