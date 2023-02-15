import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { TopStoriesResponseBody, UserIdQuery } from './dto/app.dto';
import { ThrottlerWithUserGuard } from './throttler-with-user.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(ThrottlerWithUserGuard)
  @Get('data')
  async getTopStories(
    @Query()
    query: UserIdQuery,
  ): Promise<TopStoriesResponseBody> {
    return this.appService.getTopStories();
  }
}
