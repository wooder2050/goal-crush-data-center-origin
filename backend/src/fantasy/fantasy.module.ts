import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FantasyController } from './fantasy.controller';
import { FantasyService } from './fantasy.service';

@Module({
  imports: [PrismaModule],
  controllers: [FantasyController],
  providers: [FantasyService],
})
export class FantasyModule {}
