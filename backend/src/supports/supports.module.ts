import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupportsController } from './supports.controller';
import { SupportsService } from './supports.service';

@Module({
  imports: [PrismaModule],
  controllers: [SupportsController],
  providers: [SupportsService],
})
export class SupportsModule {}
