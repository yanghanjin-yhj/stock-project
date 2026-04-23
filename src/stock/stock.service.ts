// src/stock/stock.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class StockService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async getPrice(stockCode: string) {
    // 1. [핵심] AuthService가 이제 비동기로 토큰을 가져오므로 await 필수
    const token = await this.authService.getAccessToken();

    const url = `${this.configService.get('KIS_URL')}/uapi/domestic-stock/v1/quotations/inquire-price`;

    const headers = {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`, // 위에서 받은 token 사용
      appkey: this.configService.get('KIS_APPKEY'),
      appsecret: this.configService.get('KIS_SECRET'),
      tr_id: 'FHKST01010100',
    };

    const params = {
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: stockCode,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers, params }),
      );

      if (response.data.rt_cd !== '0') {
        console.error('KIS API 내부 에러:', response.data.msg1);
        throw new Error(response.data.msg1);
      }

      return {
        code: stockCode,
        name: response.data.output.hts_kor_isnm,
        price: response.data.output.stck_prpr,
      };
    } catch (error) {
      const errorDetail = error.response?.data || error.message;
      console.error('🔴 상세 에러 로그:', JSON.stringify(errorDetail, null, 2));
      throw new InternalServerErrorException(
        error.response?.data?.msg1 || '주가 조회 중 서버 에러 발생',
      );
    }
  }
}