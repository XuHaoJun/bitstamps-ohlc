import {
	ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as _ from 'lodash';

/**
 * @publicApi
 */
@Injectable()
export class ThrottlerWithUserGuard extends ThrottlerGuard {
  /**
   * Throttles incoming HTTP requests.
   * All the outgoing requests will contain RFC-compatible RateLimit headers.
   * @see https://tools.ietf.org/id/draft-polli-ratelimit-headers-00.html#header-specifications
   * @throws ThrottlerException
   */
  protected async handleRequest(
    context: ExecutionContext,
    ipLimit: number,
    ipTtl: number,
  ): Promise<boolean> {
    // Here we start to check the amount of requests being done against the ttl.
    const { req, res } = this.getRequestResponse(context);

    // Return early if the current user agent should be ignored.
    if (Array.isArray(this.options.ignoreUserAgents)) {
      for (const pattern of this.options.ignoreUserAgents) {
        if (pattern.test(req.headers['user-agent'])) {
          return true;
        }
      }
    }

    const configs: Record<TrackerType, { limit: number; ttl: number }> = {
      ip: { limit: ipLimit, ttl: ipTtl },
      id: { limit: 5, ttl: 60 },
    };
    const trackers = this.getTrackers(req);
    const tooManyReqErrData: TooManyRequestErrorData = {};
    // TODO
    // refactor to write header once if find maximum limit.
    for (const tracker of trackers) {
      const limit = configs[tracker.type].limit;
      const ttl = configs[tracker.type].ttl;
      const key = this.generateKey(context, tracker.value);
      const { totalHits, timeToExpire } = await this.storageService.increment(
        key,
        ttl,
      );

      // Throw an error when the user reached their limit.
      if (totalHits > limit) {
        res.header('Retry-After', timeToExpire);
        tooManyReqErrData[tracker.type] = totalHits;
      } else {
        res.header(`${this.headerPrefix}-Limit`, limit);
        // We're about to add a record so we need to take that into account here.
        // Otherwise the header says we have a request left when there are none.
        res.header(
          `${this.headerPrefix}-Remaining`,
          Math.max(0, limit - totalHits),
        );
        res.header(`${this.headerPrefix}-Reset`, timeToExpire);
      }
    }
    if (!_.isEmpty(tooManyReqErrData)) {
      this.throwThrottlingException2(tooManyReqErrData);
    }

    return true;
  }

  protected getTrackers(req: Record<string, any>): Tracker[] {
    const trackers: Tracker[] = [];
    if (req.ip) {
      trackers.push({ type: 'ip', value: req.ip });
    }
    if (req.query.user) {
      trackers.push({ type: 'id', value: req.query.user });
    }
    return trackers;
  }

  protected throwThrottlingException2(
    tooManyReqErrData: TooManyRequestErrorData,
  ): void {
    throw new HttpException(tooManyReqErrData, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export type TooManyRequestErrorData = Record<string, number>;

export type TrackerType = 'ip' | 'id';

export interface Tracker {
  type: 'ip' | 'id';
  value: string;
}
