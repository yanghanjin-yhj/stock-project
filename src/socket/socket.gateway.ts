import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StockService } from '../stock/stock.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket']
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 클라이언트 ID별로 인터벌을 관리하여 메모리 누수 방지
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(private readonly stockService: StockService) {}

  handleConnection(client: Socket) {
    console.log(`🚀 클라이언트 접속 성공: ${client.id}`);
    
    // 2초마다 주가 데이터를 가져와서 전송하는 루프 시작
    const interval = setInterval(async () => {
      try {
        // [수정 포인트] 이제 getPrice 내부에서 await authService.getAccessToken()을 하므로 
        // 여기서도 비동기 처리가 정상적으로 완료될 때까지 기다립니다.
        const data = await this.stockService.getPrice('005930');
        
        if (data) {
          client.emit('stockUpdate', data);
          console.log(`📦 [${data.code}] 전송 완료: ${data.price}원`);
        } else {
          console.warn('⚠️ 데이터를 가져왔으나 내용이 비어있음');
        }
      } catch (e) {
        // 토큰 만료나 API 에러가 나더라도 인터벌이 죽지 않도록 에러만 출력합니다.
        console.error('❌ 소켓 전송 루프 에러:', e.message);
        client.emit('error', { message: '데이터 조회 중 에러 발생', detail: e.message });
      }
    }, 2000);

    this.intervals.set(client.id, interval);
  }

  handleDisconnect(client: Socket) {
    console.log(`👋 클라이언트 접속 종료: ${client.id}`);
    
    // 클라이언트가 나가면 해당 인터벌을 확실히 제거합니다.
    const interval = this.intervals.get(client.id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(client.id);
    }
  }
}