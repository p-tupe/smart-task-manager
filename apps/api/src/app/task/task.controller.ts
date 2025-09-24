import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from './task.service';
import { Task, CreateTaskDto, UpdateTaskDto } from '@smart-task-manager/data';
import { GetUser } from '../auth/get-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @GetUser() user: AuthenticatedUser
  ): Promise<Task> {
    return await this.taskService.create(createTaskDto, user.id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@GetUser() user: AuthenticatedUser): Promise<Task[]> {
    return await this.taskService.findAll(user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser
  ): Promise<Task> {
    return await this.taskService.findOne(+id, user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser() user: AuthenticatedUser
  ): Promise<Task> {
    return await this.taskService.update(+id, updateTaskDto, user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser
  ): Promise<void> {
    return await this.taskService.remove(+id, user.id);
  }
}
