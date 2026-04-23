import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiKey } from './entities/api-key.entity';

@Injectable()
export class AuthService {
  private cachedToken: string | null = null;
  private expiredAt: Date | null = null;
  private isRefreshing = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}


   async getAccessToken(): Promise<string> {
    const now = new Date();
    const safetyMargin = 3600 * 1000;

    // 1차 유효 토큰 확인
    if (this.cachedToken && this.expiredAt && this.expiredAt.getTime() > now.getTime()) return this.cachedToken;

    // 2차 유효 토큰 확인
    const latestKey = await this.apiKeyRepository.findOne({
      where: { provider: 'KIS' },
      order: { expired_at: 'DESC' },
    });

    if (latestKey && latestKey.expired_at.getTime() > now.getTime() + safetyMargin) {
      this.cachedToken = latestKey.access_token;
      this.expiredAt = latestKey.expired_at;
      return this.cachedToken;
    }

    if (this.isRefreshing) {
      console.log('⏳ 토큰 발급 중... 잠시 대기 후 재시도합니다.');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.getAccessToken(); // 재귀 호출
    }

    return await this.refreshAccessToken();
  }

  async refreshAccessToken(): Promise<string> {
    const url = `${this.configService.get('KIS_URL')}/oauth2/tokenP`;
    const body = {
      grant_type: 'client_credentials',
      appkey: this.configService.get('KIS_APPKEY'),
      appsecret: this.configService.get('KIS_SECRET'),
    };

    this.isRefreshing = true; // 👈 발급 시작 시 잠금

    try {
      const response = await firstValueFrom(this.httpService.post(url, body));
      const token = response.data.access_token;
      const expiredAt = new Date(response.data.access_token_token_expired);

      // DB 저장
      await this.apiKeyRepository.save({
        provider: 'KIS',
        access_token: token,
        expired_at: expiredAt,
      });

      // 메모리 갱신
      this.cachedToken = token;
      this.expiredAt = expiredAt;

      console.log('✅ KIS 신규 토큰 발급 및 DB 저장 완료');
      return token;
    } catch (error) {
      console.error('❌ 토큰 발급 실패:', error.response?.data || error.message);
      throw new InternalServerErrorException('KIS 인증 실패');
    } finally {
      this.isRefreshing = false; // 👈 성공하든 실패하든 잠금 해제
    }
  }
  

 
}