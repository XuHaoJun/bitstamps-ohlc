import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import * as _ from 'lodash';
import { concat, filter, from, Observable, Subject, Subscription } from 'rxjs';
import { Server, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { LiveTradeService, parseChannel } from './liveTrade.service';

@WebSocketGateway({ path: '/streaming' })
export class LiveTradeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clientSessions = new Map<WebSocket, ClientSession>();

  constructor(private liveTradeSvc: LiveTradeService) {
    this.clientSessions = new Map();
  }

  handleConnection(client: WebSocket) {
    this.clientSessions.set(client, {
      id: uuidv4(),
      currencyPairs: [],
      maxCurrencyPair: 10,
      liveTradeSubscriptions: {},
      ohlcSubscriptions: {},
    });
  }

  handleDisconnect(client: WebSocket) {
    const session = this.clientSessions.get(client);
    for (const cp in session.liveTradeSubscriptions) {
      const sub = session.liveTradeSubscriptions[cp];
      sub.unsubscribe();
    }
    for (const cp in session.liveTradeSubscriptions) {
      const sub = session.ohlcSubscriptions[cp];
      sub.unsubscribe();
    }
    this.clientSessions.delete(client);
  }

  @SubscribeMessage('subscribe')
  subscribeMany(
    @MessageBody() data: SubscribeLiveTradeData,
    @ConnectedSocket() client: WebSocket,
  ): Observable<WsResponse<any>> {
    const session = this.clientSessions.get(client);

    const currencyPairs = _.uniq(data.currencyPairs);
    const totalCurrencyPairs = _.uniq([
      ...session.currencyPairs,
      ...currencyPairs,
    ]);

    if (totalCurrencyPairs.length >= session.maxCurrencyPair) {
      return from(
        currencyPairs.map((cp) => ({
          event: 'bts:subscription_failed',
          channel: `live_trades_${cp}`,
          data: {
            maxCurrencyPair: session.maxCurrencyPair,
          },
        })),
      );
    }

    const neededCurrencyPairs = _.without(
      currencyPairs,
      ...session.currencyPairs,
    );

    session.currencyPairs = totalCurrencyPairs;

    const tradeSubject = new Subject();

    for (const cp of neededCurrencyPairs) {
      const liveTradeSub = this.createLiveTradeObservable(cp).subscribe(
        (data) => {
          tradeSubject.next(data);
        },
      );
      session.liveTradeSubscriptions[cp] = liveTradeSub;

      if (data.ohlc.enabled) {
        const ohlcSub = this.createOhlcObservable(cp).subscribe((data) => {
          tradeSubject.next(data);
        });
        session.ohlcSubscriptions[cp] = ohlcSub;
      }
    }

    const successMsgs = from(
      currencyPairs.map((cp) => ({
        event: 'bts:subscription_succeeded',
        channel: `live_trades_${cp}`,
        data: {},
      })),
    );

    return concat(successMsgs, tradeSubject.asObservable()) as Observable<
      WsResponse<any>
    >;
  }

  @SubscribeMessage('unsubscribe')
  unsubscribeMany(
    @MessageBody() data: UnsubscribeLiveTradeData,
    @ConnectedSocket() client: WebSocket,
  ): Observable<WsResponse<any>> {
    const session = this.clientSessions.get(client);

    const currencyPairs = _.uniq(data.currencyPairs);

    for (const cp of currencyPairs) {
      const sub = session.liveTradeSubscriptions[cp];
      if (sub) {
        sub.unsubscribe();
        delete session.liveTradeSubscriptions[cp];
      }
      const ohlcSub = session.ohlcSubscriptions[cp];
      if (ohlcSub) {
        ohlcSub.unsubscribe();
        delete session.ohlcSubscriptions[cp];
      }
    }

    const successMsgs = from(
      currencyPairs.map((cp) => ({
        event: 'bts:unsubscription_succeeded',
        channel: `live_trades_${cp}`,
        data: {},
      })),
    );

    return successMsgs;
  }

  private createLiveTradeObservable(currencyPair: string) {
    return this.liveTradeSvc.bitstampObservable.pipe(
      filter(({ channel, event }) => {
        const parsed = parseChannel(channel);
        return (
          parsed && parsed.currencryPair === currencyPair && event === 'trade'
        );
      }),
    );
  }

  private createOhlcObservable(currencyPair: string) {
    return this.liveTradeSvc.ohlcObservable.pipe(
      filter(({ channel }) => {
        const parsed = parseChannel(channel);
        return parsed && parsed.currencryPair === currencyPair;
      }),
    );
  }
}

interface SubscribeLiveTradeData {
  currencyPairs: string[];
  ohlc: {
    enabled: boolean;
  };
}

interface UnsubscribeLiveTradeData {
  currencyPairs: string[];
}

interface ClientSession {
  id: string;
  currencyPairs: string[];
  maxCurrencyPair: number;
  // key is currencryPair
  liveTradeSubscriptions: Record<string, Subscription>;
  ohlcSubscriptions: Record<string, Subscription>;
}
