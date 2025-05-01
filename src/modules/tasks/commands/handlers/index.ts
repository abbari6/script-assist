import { CreateTaskHandler } from './create-task.handler';
import { UpdateTaskHandler } from './update-task.handler';
import { RemoveTaskHandler } from './remove-task.handler';
import { UpdateTaskStatusHandler } from './update-task-status.handler';
import { BatchProcessTasksHandler } from './batch-process-tasks.handler';

export const CommandHandlers = [
  CreateTaskHandler,
  UpdateTaskHandler,
  RemoveTaskHandler,
  UpdateTaskStatusHandler,
  BatchProcessTasksHandler,
];
