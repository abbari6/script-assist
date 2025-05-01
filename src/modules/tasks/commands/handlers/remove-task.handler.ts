import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { RemoveTaskCommand } from '../remove-task.command';
import { Task } from '../../entities/task.entity';

@CommandHandler(RemoveTaskCommand)
export class RemoveTaskHandler implements ICommandHandler<RemoveTaskCommand> {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async execute(command: RemoveTaskCommand): Promise<void> {
    const { id } = command;
    
    const task = await this.tasksRepository.findOne({
      where: { id },
    });
    
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.tasksRepository.delete(task.id);
  }
}
