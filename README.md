## Description

subscribue/unsubscribue client-side example:

```javascript
// subscribe
socket.emit(
  JSON.stringify({
    event: 'subscribe',
    data: {
      currencyPairs: ['btcusd', 'btceur'],
      // 是否開啟 ohlc
      ohlc: {
        enabled: true,
      },
    },
  }),
);

// unsubscribe
socket.emit(
  JSON.stringify({
    event: 'unsubscribe',
    data: {
      currencyPairs: ['btceur'],
    },
  }),
);
```

OHLC 資料 example:

```json
{
  "event": "ohlc",
  "channel": "live_trades_btcusd",
  "data": {
    // 每分鐘
    // ohcl 00 ~ 59 秒
    "startTimestamp": "1676539620",
    "endTimestamp": "1676539679",

    // 第一筆價格與交易 id
    "open": { "price": 24606, "id": 272979725 },
    // 最高價格與交易 ids
    "high": { "price": 24606, "ids": [272979725] },
    "low": { "price": 24606, "ids": [272979725] },
    "close": { "price": 24606, "id": 272979725 }
  }
}
```

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
