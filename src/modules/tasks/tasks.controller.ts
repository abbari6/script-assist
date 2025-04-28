import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { AccessTokenGuard } from '@common/guards/access-token.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator'; // <- Let's assume you have this
import { JwtPayload } from '@modules/auth/auth.types';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    // Anti-pattern: Controller directly accessing repository
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  create(@CurrentUser() user: JwtPayload, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create({ ...createTaskDto, userId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'Find all tasks with optional filtering' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Inefficient approach: Inconsistent pagination handling
    if (page && !limit) {
      limit = 10; // Default limit
    }

    // Inefficient processing: Manual filtering instead of using repository
    let tasks = await this.tasksService.findAll(user.id);

    // Inefficient filtering: In-memory filtering instead of database filtering
    if (status) {
      tasks = tasks.filter(task => task.status === (status as TaskStatus));
    }

    if (priority) {
      tasks = tasks.filter(task => task.priority === (priority as TaskPriority));
    }

    // Inefficient pagination: In-memory pagination
    if (page && limit) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      tasks = tasks.slice(startIndex, endIndex);
    }

    return {
      data: tasks,
      count: tasks.length,
      // Missing metadata for proper pagination
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  async getStats(@CurrentUser() user: JwtPayload) {
    // Inefficient approach: N+1 query problem
    const tasks = await this.taskRepository.find({ where: { userId: user.id } });

    // Inefficient computation: Should be done with SQL aggregation
    const statistics = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
      highPriority: tasks.filter(t => t.priority === TaskPriority.HIGH).length,
    };

    return statistics;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a task by ID' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const task = await this.tasksService.findOne(id);

    if (!task || task.userId !== user.id) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }

    return task;
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    // No validation if task exists before update
    const task = await this.tasksService.findOne(id);

    if (!task || task.userId !== user.id) {
      throw new HttpException('Task not found or unauthorized', HttpStatus.FORBIDDEN);
    }

    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const task = await this.tasksService.findOne(id);

    if (!task || task.userId !== user.id) {
      throw new HttpException('Task not found or unauthorized', HttpStatus.FORBIDDEN);
    }

    return this.tasksService.remove(id);
  }
  @Post('batch')
  @ApiOperation({ summary: 'Batch process multiple tasks' })
  async batchProcess(
    @CurrentUser() user: JwtPayload,
    @Body() operations: { tasks: string[]; action: string },
  ) {
    // Inefficient batch processing: Sequential processing instead of bulk operations
    const { tasks: taskIds, action } = operations;
    const results = [];

    // N+1 query problem: Processing tasks one by one
    for (const taskId of taskIds) {
      try {
        const task = await this.tasksService.findOne(taskId);

        if (!task || task.userId !== user.id) {
          throw new Error('Unauthorized or task not found');
        }
        let result;

        switch (action) {
          case 'complete':
            result = await this.tasksService.update(taskId, { status: TaskStatus.COMPLETED });
            break;
          case 'delete':
            result = await this.tasksService.remove(taskId);
            break;
          default:
            throw new HttpException(`Unknown action: ${action}`, HttpStatus.BAD_REQUEST);
        }

        results.push({ taskId, success: true, result });
      } catch (error) {
        // Inconsistent error handling
        results.push({
          taskId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}
