import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CURRENCRY_PARIS } from '../liveTrade.constant';

export class SubscribeLiveTradeDataOhlcConfig {
  @IsBoolean()
  @IsDefined()
  enabled: boolean;
}

export class SubscribeLiveTradeData {
  @IsIn(CURRENCRY_PARIS, { each: true })
  @IsArray()
  @IsDefined()
  currencyPairs: string[];

  @ValidateNested()
  @IsDefined()
  ohlc: SubscribeLiveTradeDataOhlcConfig;
}

export class UnsubscribeLiveTradeData {
  @IsIn(CURRENCRY_PARIS, { each: true })
  @IsArray()
  @IsDefined()
  currencyPairs: string[];
}
