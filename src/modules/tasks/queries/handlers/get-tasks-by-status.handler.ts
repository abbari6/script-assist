import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetTasksByStatusQuery } from '../get-tasks-by-status.query';
import { Task } from '../../entities/task.entity';

@QueryHandler(GetTasksByStatusQuery)
export class GetTasksByStatusHandler implements IQueryHandler<GetTasksByStatusQuery> {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async execute(query: GetTasksByStatusQuery): Promise<Task[]> {
    const { status } = query;
    return this.tasksRepository.find({ where: { status } });
  }
}
