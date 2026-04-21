import { Controller, Get, Query } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('price')
  async getStockPrice(@Query('code') code: string) {
    return await this.stockService.getPrice(code);
  }
}