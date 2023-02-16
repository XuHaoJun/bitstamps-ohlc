import { webSocket } from 'rxjs/webSocket';
import { WebSocket } from 'ws';

// const webSocketSubject = webSocket({
//   url: 'wss://ws.bitstamp.net',
//   WebSocketCtor: WebSocket as any,
// });

// webSocketSubject.subscribe((data) => {
//   console.log('received: %s', JSON.stringify(data));
// });
// webSocketSubject.next({
//   event: 'bts:subscribe',
//   data: {
//     channel: 'live_trades_btcusd',
//   },
// });
// received: {"event":"bts:subscription_succeeded","channel":"live_trades_btcusd","data":{}}
// received: {"data":{"id":272944338,"timestamp":"1676510678","amount":0.00974,"amount_str":"0.00974000","price":24629,"price_str":"24629","type":0,"microtimestamp":"1676510678160000","buy_order_id":1587919681548289,"sell_order_id":1587919680561152},"channel":"live_trades_btcusd","event":"trade"}
// received: {"data":{"id":272944347,"timestamp":"1676510685","amount":0.11,"amount_str":"0.11000000","price":24633,"price_str":"24633","type":1,"microtimestamp":"1676510685218000","buy_order_id":1587919710212097,"sell_order_id":1587919710453763},"channel":"live_trades_btcusd","event":"trade"}

const webSocketSubject = webSocket({
  url: 'ws://localhost:3000/streaming',
  WebSocketCtor: WebSocket as any,
});

webSocketSubject.subscribe((data) => {
  console.log('received: %s', JSON.stringify(data));
});
webSocketSubject.next({
  event: 'subscribe',
  data: {
    currencyPairs: ['btcusd', 'btceur'],
    ohlc: {
      enabled: true,
    },
  },
});

setTimeout(() => {
  webSocketSubject.next({
    event: 'unsubscribe',
    data: {
      currencyPairs: ['btcusd'],
    },
  });
}, 10 * 1000);
