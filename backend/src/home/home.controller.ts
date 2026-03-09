import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HomeService } from './home.service';

@ApiTags('Home')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('data')
  @ApiOperation({ summary: '홈페이지 데이터', description: '홈페이지에 필요한 모든 데이터를 한 번에 반환합니다' })
  getData() {
    return this.homeService.getHomePageData();
  }
}
