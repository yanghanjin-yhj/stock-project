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
    private readonly authService: AuthService, // 발급받은 토큰을 가져오기 위해 주입
  ) {}

  async getPrice(stockCode: string) {
    const url = `${this.configService.get('KIS_URL')}/uapi/domestic-stock/v1/quotations/inquire-price`;

    // 한국투자증권 API가 요구하는 필수 헤더 설정
    const headers = {
      'Content-Type': 'application/json',
      authorization: `Bearer ${this.authService.getAccessToken()}`, // 여기서 토큰 사용
      appkey: this.configService.get('KIS_APPKEY'),
      appsecret: this.configService.get('KIS_SECRET'),
      tr_id: 'FHKST01010100', // 현재가 조회용 거래 ID
    };

    const params = {
      FID_COND_MRKT_DIV_CODE: 'J', // 주식, 상장지수펀드 등
      FID_INPUT_ISCD: stockCode, // 종목코드 (예: 005930)
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers, params }),
      );

      // 만약 KIS 서버는 200을 줬는데 내용이 에러일 경우를 대비해 체크
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
      // 👈 여기서 KIS가 직접 뱉은 에러를 확인하세요!
      const errorDetail = error.response?.data || error.message;
      console.error('🔴 상세 에러 로그:', JSON.stringify(errorDetail, null, 2));

      throw new InternalServerErrorException(
        error.response?.data?.msg1 || '주가 조회 중 서버 에러 발생',
      );
    }
  }
}
