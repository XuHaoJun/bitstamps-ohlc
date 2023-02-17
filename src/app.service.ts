import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios, { isAxiosError } from 'axios';
import { TopStoriesResponseBody } from './dto/app.dto';

@Injectable()
export class AppService {
  async getTopStories(): Promise<TopStoriesResponseBody> {
    try {
      const storiesRes = await axios.get(
        'https://hacker-news.firebaseio.com/v0/topstories.json',
      );
      return {
        result: storiesRes.data,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        throw new HttpException(
          'hacker news api not working.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else {
        throw error;
      }
    }
  }
}
