import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';
import { UserRole } from './user-role.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  parentId?: number;

  @ManyToOne(() => Organization, (org) => org.children)
  @JoinColumn({ name: 'parentId' })
  parent?: Organization;

  @OneToMany(() => Organization, (org) => org.parent)
  children!: Organization[];

  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  @OneToMany(() => Task, (task) => task.organization)
  tasks!: Task[];

  @OneToMany(() => UserRole, (userRole) => userRole.organization)
  userRoles!: UserRole[];
}

export interface CreateOrganizationDto {
  name: string;
  description?: string;
  parentId?: number;
}

export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
  parentId?: number;
}
