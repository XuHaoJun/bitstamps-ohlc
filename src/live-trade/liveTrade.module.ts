import { Module } from '@nestjs/common';
import { LiveTradeGateway } from './liveTrade.gateway';
import { LiveTradeService } from './liveTrade.service';

@Module({
  providers: [LiveTradeGateway, LiveTradeService],
  exports: [LiveTradeGateway, LiveTradeService],
})
export class LiveTradeModule {}
