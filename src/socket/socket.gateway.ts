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
    origin: '*', // 👈 테스트 중에는 모든 오리진 허용
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'] // 개발 편의를 위해 모든 오리진 허용
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(private readonly stockService: StockService) {}

  handleConnection(client: Socket) {
    console.log(`🚀 클라이언트 접속 성공: ${client.id}`);
    
    const interval = setInterval(async () => {
      try {
        console.log('📡 주가 데이터 가져오는 중...');
        const data = await this.stockService.getPrice('005930');
        
        if (data) {
          client.emit('stockUpdate', data);
          console.log('📦 데이터 전송 완료:', data.price);
        } else {
          console.warn('⚠️ 데이터를 가져왔으나 내용이 비어있음');
        }
      } catch (e) {
        // 여기가 핵심입니다. 에러가 나도 setInterval은 계속 돌아야 합니다.
        console.error('❌ 소켓 전송 루프 에러:', e.message);
      }
    }, 2000);

    this.intervals.set(client.id, interval);
  }

  handleDisconnect(client: Socket) {
    console.log(`👋 클라이언트 접속 종료: ${client.id}`);
    // 연결 끊기면 인터벌 제거 (메모리 누수 방지)
    clearInterval(this.intervals.get(client.id));
    this.intervals.delete(client.id);
  }
}