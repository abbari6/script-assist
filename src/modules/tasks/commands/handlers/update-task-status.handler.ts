import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UpdateTaskStatusCommand } from '../update-task-status.command';
import { Task } from '../../entities/task.entity';

@CommandHandler(UpdateTaskStatusCommand)
export class UpdateTaskStatusHandler implements ICommandHandler<UpdateTaskStatusCommand> {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async execute(command: UpdateTaskStatusCommand): Promise<Task> {
    const { id, status } = command;
    
    const task = await this.tasksRepository.findOne({
      where: { id },
    });
    
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    task.status = status;
    return this.tasksRepository.save(task);
  }
}
