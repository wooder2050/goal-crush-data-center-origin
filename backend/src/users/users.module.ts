import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserPointsController, UsersProfileController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserPointsController, UsersProfileController],
  providers: [UsersService],
})
export class UsersModule {}
