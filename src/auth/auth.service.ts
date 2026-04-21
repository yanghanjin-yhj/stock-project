import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService implements OnModuleInit {
  private accessToken: string | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // 서버가 실행될 때 자동으로 호출되는 NestJS 생명주기 훅
  async onModuleInit() {
    if (this.accessToken) return;
    await this.refreshAccessToken();
  }

  async refreshAccessToken() {
    const url = `${this.configService.get('KIS_URL')}/oauth2/tokenP`;
    const body = {
      grant_type: 'client_credentials',
      appkey: this.configService.get('KIS_APPKEY'),
      appsecret: this.configService.get('KIS_SECRET'),
    };

    try {
      const response = await firstValueFrom(this.httpService.post(url, body));
      this.accessToken = response.data.access_token;
      console.log('✅ KIS Access Token 발급 완료');
    } catch (error) {
      console.error('❌ 토큰 발급 실패:', error.response?.data || error.message);
      throw new InternalServerErrorException('KIS 인증 실패');
    }
  }

  // 다른 서비스(StockService 등)에서 토큰이 필요할 때 호출
  getAccessToken(): string | null {
    if (!this.accessToken) throw new InternalServerErrorException('액세스 토큰이 없습니다.');
    return this.accessToken;
  }
}