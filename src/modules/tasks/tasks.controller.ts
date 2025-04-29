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
import { TaskStatus } from './enums/task-status.enum';
import { AccessTokenGuard } from '@common/guards/access-token.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@modules/auth/auth.types';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

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
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const { data, total } = await this.tasksService.findAll(
      user.id,
      { status, priority },
      page,
      limit,
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  async getStats(@CurrentUser() user: JwtPayload) {
    return this.tasksService.getStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a task by ID' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const task = await this.tasksService.findOne(id);

    if (task.userId !== user.id) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
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
    const task = await this.tasksService.findOne(id);

    if (task.userId !== user.id) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const task = await this.tasksService.findOne(id);

    if (task.userId !== user.id) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    await this.tasksService.remove(id);
    return { message: 'Task deleted successfully' };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch process multiple tasks' })
  async batchProcess(
    @CurrentUser() user: JwtPayload,
    @Body() body: { tasks: string[]; action: 'complete' | 'delete' },
  ) {
    return this.tasksService.batchProcess(user.id, body.tasks, body.action);
  }
}
