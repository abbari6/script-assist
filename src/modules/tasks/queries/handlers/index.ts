import { GetTaskHandler } from './get-task.handler';
import { GetTasksHandler } from './get-tasks.handler';
import { GetTasksByStatusHandler } from './get-tasks-by-status.handler';
import { GetTaskStatsHandler } from './get-task-stats.handler';

export const QueryHandlers = [
  GetTaskHandler,
  GetTasksHandler,
  GetTasksByStatusHandler,
  GetTaskStatsHandler,
];
