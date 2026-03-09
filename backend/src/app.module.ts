import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { SeasonsModule } from './seasons/seasons.module';
import { TeamsModule } from './teams/teams.module';
import { CoachesModule } from './coaches/coaches.module';
import { PlayersModule } from './players/players.module';
import { MatchesModule } from './matches/matches.module';
import { StatsModule } from './stats/stats.module';
import { HomeModule } from './home/home.module';
import { SupportsModule } from './supports/supports.module';
import { UsersModule } from './users/users.module';
import { RatingsModule } from './ratings/ratings.module';
import { CommunityModule } from './community/community.module';
import { FantasyModule } from './fantasy/fantasy.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    SeasonsModule,
    TeamsModule,
    CoachesModule,
    PlayersModule,
    MatchesModule,
    StatsModule,
    HomeModule,
    SupportsModule,
    UsersModule,
    RatingsModule,
    CommunityModule,
    FantasyModule,
    AdminModule,
  ],
})
export class AppModule {}
