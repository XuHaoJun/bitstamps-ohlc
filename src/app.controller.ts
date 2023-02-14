import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { TopStoriesResponseBody, UserIdQuery } from './dto/app.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('data')
  async getTopStories(
    @Query() query: UserIdQuery,
  ): Promise<TopStoriesResponseBody> {
    return this.appService.getTopStories();
  }
}
