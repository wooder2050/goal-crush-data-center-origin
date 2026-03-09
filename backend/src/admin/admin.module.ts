import { Module } from '@nestjs/common';
import { AdminMatchesController } from './admin-matches.controller';
import { AdminMatchesService } from './admin-matches.service';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';
import { AdminTeamsController } from './admin-teams.controller';
import { AdminTeamsService } from './admin-teams.service';

@Module({
  controllers: [AdminMatchesController, AdminStatsController, AdminTeamsController],
  providers: [AdminMatchesService, AdminStatsService, AdminTeamsService],
})
export class AdminModule {}
