import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetTasksQuery } from '../get-tasks.query';
import { Task } from '../../entities/task.entity';

@QueryHandler(GetTasksQuery)
export class GetTasksHandler implements IQueryHandler<GetTasksQuery> {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async execute(query: GetTasksQuery): Promise<{ data: Task[]; total: number }> {
    const { userId, filters, page, limit } = query;
    
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
}
