import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Organization, User, UserRole, Task } from '@smart-task-manager/data';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import bcrypt from 'bcrypt';

export interface UserWithRoles {
  id: number;
  username: string;
  orgId: number;
  organization: Organization;
  userRoles: UserRole[];
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @Inject(JwtService)
    private jwtService: JwtService
  ) {}

  async validateUser(
    username: string,
    password: string
  ): Promise<Omit<User, 'password'> & { access_token: string }> {
    const user = await this.userRepository.findOne({ where: { username } });
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      console.error('Invalid password');
      return null;
    }

    const access_token = this.jwtService.sign({
      username,
      sub: user.id,
      orgId: user.orgId,
    });

    delete user.password;

    return { access_token, ...user };
  }

  async getUserWithRoles(userId: number): Promise<UserWithRoles> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'userRoles'],
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return user as UserWithRoles;
  }

  async getAccessibleOrgIds(userId: number): Promise<number[]> {
    const user = await this.getUserWithRoles(userId);
    const accessibleOrgIds = new Set<number>();

    // Get all user roles for this user
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['organization'],
    });

    for (const userRole of userRoles) {
      const orgId = userRole.orgId;

      if (userRole.role === 'owner') {
        // Owner has access to their org and all child orgs
        accessibleOrgIds.add(orgId);
        const childOrgIds = await this.getChildOrganizationIds(orgId);
        childOrgIds.forEach((id) => accessibleOrgIds.add(id));
      } else if (userRole.role === 'admin' || userRole.role === 'viewer') {
        // Admin and viewer have access only to their specific org
        accessibleOrgIds.add(orgId);
      }
    }

    return Array.from(accessibleOrgIds);
  }

  async getChildOrganizationIds(parentOrgId: number): Promise<number[]> {
    const childOrgs = await this.organizationRepository.find({
      where: { parentId: parentOrgId },
    });

    const allChildIds: number[] = [];

    for (const childOrg of childOrgs) {
      allChildIds.push(childOrg.id);
      // Recursively get grandchildren
      const grandChildIds = await this.getChildOrganizationIds(childOrg.id);
      allChildIds.push(...grandChildIds);
    }

    return allChildIds;
  }

  async canReadTask(userId: number, taskId: number): Promise<boolean> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['organization'],
    });

    if (!task) {
      return false;
    }

    const accessibleOrgIds = await this.getAccessibleOrgIds(userId);
    return accessibleOrgIds.includes(task.orgId);
  }

  async canModifyTask(userId: number, taskId: number): Promise<boolean> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['organization'],
    });

    if (!task) {
      return false;
    }

    // Task creator can always modify their own tasks
    if (task.userId === userId) {
      return true;
    }

    // Check if user has owner or admin role in the task's organization
    const userRole = await this.userRoleRepository.findOne({
      where: { userId, orgId: task.orgId },
    });

    if (userRole && (userRole.role === 'owner' || userRole.role === 'admin')) {
      return true;
    }

    // Check if user is owner of parent organization
    const taskOrg = await this.organizationRepository.findOne({
      where: { id: task.orgId },
    });

    if (taskOrg?.parentId) {
      const parentOrgRole = await this.userRoleRepository.findOne({
        where: { userId, orgId: taskOrg.parentId },
      });

      if (parentOrgRole && parentOrgRole.role === 'owner') {
        return true;
      }
    }

    return false;
  }

  async canCreateTaskInOrg(userId: number, orgId: number): Promise<boolean> {
    const accessibleOrgIds = await this.getAccessibleOrgIds(userId);
    return accessibleOrgIds.includes(orgId);
  }

  async getTasksForUser(userId: number): Promise<Task[]> {
    const accessibleOrgIds = await this.getAccessibleOrgIds(userId);

    if (accessibleOrgIds.length === 0) {
      return [];
    }

    return await this.taskRepository.find({
      where: { orgId: In(accessibleOrgIds) },
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTasksForUserByStatus(userId: number): Promise<Task[]> {
    const accessibleOrgIds = await this.getAccessibleOrgIds(userId);

    if (accessibleOrgIds.length === 0) {
      return [];
    }

    return await this.taskRepository.find({
      where: {
        orgId: In(accessibleOrgIds),
      },
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserDefaultOrgId(userId: number): Promise<number> {
    const user = await this.getUserWithRoles(userId);
    return user.orgId;
  }

  async assertCanReadTask(userId: number, taskId: number): Promise<void> {
    const canRead = await this.canReadTask(userId, taskId);
    if (!canRead) {
      throw new ForbiddenException(
        'You do not have permission to view this task'
      );
    }
  }

  async assertCanModifyTask(userId: number, taskId: number): Promise<void> {
    const canModify = await this.canModifyTask(userId, taskId);
    if (!canModify) {
      throw new ForbiddenException(
        'You do not have permission to modify this task'
      );
    }
  }
}
