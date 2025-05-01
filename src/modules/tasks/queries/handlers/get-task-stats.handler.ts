import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetTaskStatsQuery } from '../get-task-stats.query';
import { Task } from '../../entities/task.entity';
import { TaskStatus } from '../../enums/task-status.enum';

@QueryHandler(GetTaskStatsQuery)
export class GetTaskStatsHandler implements IQueryHandler<GetTaskStatsQuery> {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async execute(query: GetTaskStatsQuery): Promise<any> {
    const { userId } = query;
    
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
}
