# 群馥科技 Backend Developer (Node.js) Pretest

## API Server Implementation

請使用 [Express](https://expressjs.com/)、[Koa](https://koajs.com/) 或 [Nest](https://nestjs.com/) 實作一個 API server，可以使用任何其他第三方套件。

## Part 1 ：HTTP API

請在 API server 建立以下 HTTP API endpoint：

`GET http://localhost:3000/data?user=id`

並完成以下需求：

當 API endpoint 收到請求後，請 fetch 以下位址資料：
`https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty`
若資料 fetch 成功，回傳 response body { result: 取得的資料 }；資料 fetch 失敗則直接回傳
HTTP status code 500 。

## Part 2 ：Rate Limiting

將上述 API 加入 rate limiting 功能，請完成以下需求：

- 每一分鐘內，同一個 IP 最多請求 10 次；同一個用戶（User ID）最多請求 5 次。
- 當請求超過任一個次數上限時，請回傳 HTTP status code 429 ，並包含 response body `{ ip: N1,
id: N2 }`。N 1 及 N 2 分別為來自該 IP 及 User ID 在該分鐘請求的總次數。

## Part 3 ：WebSocket API

在同一個專案建立 WebSocket server，讓用戶可以透過 WebSocket client 建立 WebSocket 連線，如：
`ws://localhost:3000/streaming`

並完成以下需求：

- 在 API server 串接 [Bitstamp WebSocket API](https://www.bitstamp.net/websocket/v2/)，取得 Public channels 的 Live ticker 資料。
- 設計 WebSocket API，讓用戶可以透過 subscribe ／ unsubscribe 方法取得特定 10 個 currency
  pair（如 btcusd）的最新成交價格。特定 10 個 currency pair 可隨意選擇。
- 除了直接傳輸 currency pair 的最新成交價格外，用戶可以再另外取得 1 minute OHLC 資料 (即每分鐘
  的第一筆／最高／最低／最後一筆之成交價格)。

## Notes

- 回傳格式皆為 JSON。
- 可以假定 User ID 為 1 ~ 1000 之間的 integer。
- 您 不需要 實作前端介面。
- 請從一開始建立專案時就 commit，然後 在 GitHub 建立 repository。完成後請回信告知該 repository 在 GitHub 上的位址。
