import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User, Organization, UserRole } from '@smart-task-manager/data';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, UserRole])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
