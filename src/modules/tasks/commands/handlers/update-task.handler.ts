import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UpdateTaskCommand } from '../update-task.command';
import { Task } from '../../entities/task.entity';

@CommandHandler(UpdateTaskCommand)
export class UpdateTaskHandler implements ICommandHandler<UpdateTaskCommand> {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private readonly dataSource: DataSource,
    @InjectQueue('task-processing')
    private taskQueue: Queue,
  ) {}

  async execute(command: UpdateTaskCommand): Promise<Task> {
    const { id, updateTaskDto } = command;
    
    return await this.dataSource.transaction(async manager => {
      const task = await this.tasksRepository.findOne({
        where: { id },
      });
      
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

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
}
