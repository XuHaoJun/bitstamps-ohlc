import { Injectable } from '@nestjs/common';
import { endOfMinute, startOfMinute, subMinutes } from 'date-fns';
import { Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { CURRENCRY_PARIS, PUBLIC_CHANNEL_PREFIXS } from './liveTrade.constant';
import * as _ from 'lodash';
import * as R from 'ramda';
import { CronJob } from 'cron';
import { WebSocket } from 'ws';

@Injectable()
export class LiveTradeService {
  private bitstampSubject: WebSocketSubject<any>;
  public bitstampObservable: Observable<any>;

  private tradeEventsBuffer: any[] = [];

  private ohlcCronJob: CronJob;
  private ohlcSubject: Subject<any>;
  public ohlcObservable: Observable<any>;

  constructor() {
    this.bitstampSubject = webSocket({
      url: 'wss://ws.bitstamp.net',
      WebSocketCtor: WebSocket as any,
    });
    this.bitstampObservable = this.bitstampSubject.asObservable();

    this.bitstampSubject.subscribe((x: any) => {
      if (x.event === 'trade') {
        this.tradeEventsBuffer.push(x);
      }
    });

    for (const cp of CURRENCRY_PARIS) {
      this.bitstampSubject.next({
        event: 'bts:subscribe',
        data: {
          channel: `live_trades_${cp}`,
        },
      });
    }

    this.ohlcSubject = new Subject();
    this.ohlcObservable = this.ohlcSubject.asObservable();

    this.ohlcCronJob = new CronJob(
      '0 */1 * * * *',
      this.collectOhlcData.bind(this),
      null,
      true,
      'Asia/Taipei',
    );
  }

  // TODO
  // should try find lost ohlc data if cron no tick right time or cpu slow.
  private collectOhlcData() {
    const now = new Date();
    const startDate = startOfMinute(subMinutes(now, 1));
    const endDate = endOfMinute(startDate);

    const rangedTrades = this.tradeEventsBuffer.filter((x) => {
      const millTimestamp = Math.trunc(
        parseInt(x.data.microtimestamp, 10) / 1000,
      );
      return (
        millTimestamp >= startDate.getTime() &&
        millTimestamp <= endDate.getTime()
      );
    });

    const channelTradesMap = _.groupBy(rangedTrades, (x) => x.channel);
    for (const channelName in channelTradesMap) {
      const channelTrades = channelTradesMap[channelName];
      const trades = R.sortWith(
        [R.ascend((event) => event.data.id)],
        channelTrades,
      );
      const openTrade = trades[0];
      const highTrade = _.maxBy(trades, (x) => x.data.price);
      const lowTrade = _.minBy(trades, (x) => x.data.price);
      const closeTrade = trades[trades.length - 1];

      const open = openTrade && {
        price: openTrade.data.price,
        id: openTrade.data.id,
      };
      const high = highTrade && {
        price: highTrade.data.price,
        ids: trades
          .filter((x) => x.data.price === highTrade.data.price)
          .map((x) => x.data.id),
      };
      const low = lowTrade && {
        price: lowTrade.data.price,
        ids: trades
          .filter((x) => x.data.price === lowTrade.data.price)
          .map((x) => x.data.id),
      };
      const close = closeTrade && {
        price: closeTrade.data.price,
        id: closeTrade.data.id,
      };

      this.ohlcSubject.next({
        event: 'ohlc',
        channel: channelName,
        data: {
          startTimestamp: `${Math.trunc(startDate.getTime() / 1000)}`,
          endTimestamp: `${Math.trunc(endDate.getTime() / 1000)}`,
          open,
          high,
          low,
          close,
        },
      });
    }

    this.tradeEventsBuffer = this.tradeEventsBuffer.filter(
      (x) => !rangedTrades.some((xx) => xx === x),
    );
  }
}

export interface Channel {
  prefix: string;
  currencryPair: string;
}

export function parseChannel(channelName: string): Channel {
  const regex = new RegExp(`(${PUBLIC_CHANNEL_PREFIXS.join('|')})_(.+)`);
  const parsed = regex.exec(channelName);
  if (parsed) {
    const prefix = parsed[1];
    const currencryPair = parsed[2];
    return { prefix, currencryPair };
  } else {
    return null;
  }
}
