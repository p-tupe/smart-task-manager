import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Organization, UserRole } from '@smart-task-manager/data';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>
  ) {}

  async onModuleInit() {
    await this.seedData();
  }

  private async seedData() {
    const existingOrgs = await this.organizationRepository.count();
    if (existingOrgs > 0) {
      return;
    }

    const parentOrg = await this.organizationRepository.save({
      name: 'parent-org',
      description: 'Parent organization',
    });

    const childOrg1 = await this.organizationRepository.save({
      name: 'child-org-1',
      description: 'Child organization 1',
      parentId: parentOrg.id,
    });

    const childOrg2 = await this.organizationRepository.save({
      name: 'child-org-2',
      description: 'Child organization 2',
      parentId: parentOrg.id,
    });

    // password123
    const password =
      '$2b$10$K9z1S0SxKBh/0GZ3g6xin.sjXPbf0b/HWEvjjkWex0O7daIkyrZ8y';

    const users = [
      { username: 'Jane', password, orgId: parentOrg.id },
      { username: 'Alice', password, orgId: childOrg1.id },
      { username: 'Bob', password, orgId: childOrg1.id },
      { username: 'John', password, orgId: childOrg2.id },
    ];

    for (const userData of users) {
      const existingUser = await this.userRepository.findOne({
        where: { username: userData.username },
      });

      if (!existingUser) {
        await this.userRepository.save(userData);
      }
    }

    const jane = await this.userRepository.findOne({
      where: { username: 'Jane' },
    });
    const alice = await this.userRepository.findOne({
      where: { username: 'Alice' },
    });
    const bob = await this.userRepository.findOne({
      where: { username: 'Bob' },
    });
    const john = await this.userRepository.findOne({
      where: { username: 'John' },
    });

    const userRoles = [
      { userId: jane!.id, orgId: parentOrg.id, role: 'owner' as const },
      { userId: alice!.id, orgId: childOrg1.id, role: 'owner' as const },
      { userId: bob!.id, orgId: childOrg1.id, role: 'admin' as const },
      { userId: john!.id, orgId: childOrg2.id, role: 'owner' as const },
      { userId: john!.id, orgId: childOrg1.id, role: 'viewer' as const },
    ];

    for (const roleData of userRoles) {
      const existingRole = await this.userRoleRepository.findOne({
        where: { userId: roleData.userId, orgId: roleData.orgId },
      });

      if (!existingRole) {
        await this.userRoleRepository.save(roleData);
      }
    }
  }
}
