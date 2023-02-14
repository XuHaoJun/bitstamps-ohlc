import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export interface TopStoriesResponseBody {
  result: number[];
}

export class UserIdQuery {
  @IsOptional()
  @Transform((payload) => parseInt(payload.value, 10), { toClassOnly: true })
  @IsInt()
  @Min(1)
  @Max(1000)
  user?: number;
}
