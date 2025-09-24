import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('user_roles')
@Unique(['userId', 'orgId'])
export class UserRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  orgId!: number;

  @Column()
  role!: 'owner' | 'admin' | 'viewer';

  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Organization, (org) => org.userRoles)
  @JoinColumn({ name: 'orgId' })
  organization!: Organization;
}

export interface CreateUserRoleDto {
  userId: number;
  orgId: number;
  role: 'owner' | 'admin' | 'viewer';
}

export interface UpdateUserRoleDto {
  role?: 'owner' | 'admin' | 'viewer';
}
