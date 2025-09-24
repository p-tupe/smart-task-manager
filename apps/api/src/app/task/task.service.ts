import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, CreateTaskDto, UpdateTaskDto } from '@smart-task-manager/data';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @Inject(AuthService)
    private authService: AuthService
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    userId: number,
    orgId?: number
  ): Promise<Task> {
    const taskOrgId =
      createTaskDto.orgId ||
      orgId ||
      (await this.authService.getUserDefaultOrgId(userId));

    const canCreate = await this.authService.canCreateTaskInOrg(
      userId,
      taskOrgId
    );
    if (!canCreate) {
      throw new NotFoundException(
        'You do not have permission to create tasks in this organization'
      );
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      userId,
      status: createTaskDto.status || 'pending',
      orgId: taskOrgId,
    });
    return await this.taskRepository.save(task);
  }

  async findAll(userId: number): Promise<Task[]> {
    return await this.authService.getTasksForUser(userId);
  }

  async findOne(id: number, userId: number): Promise<Task> {
    await this.authService.assertCanReadTask(userId, id);

    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['organization'],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(
    id: number,
    updateTaskDto: UpdateTaskDto,
    userId: number
  ): Promise<Task> {
    await this.authService.assertCanModifyTask(userId, id);

    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    Object.assign(task, updateTaskDto);
    return await this.taskRepository.save(task);
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.authService.assertCanModifyTask(userId, id);

    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.taskRepository.remove(task);
  }

  async findByStatus(userId: number): Promise<Task[]> {
    return await this.authService.getTasksForUserByStatus(userId);
  }
}
