import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_URL || '*', 'http://localhost:5173', 'http://localhost:3000', 'app://.'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emitProductUpdated(products: any[]) {
    this.server.emit('product-updated', products);
  }

  emitSaleUpdated(sales: any[]) {
    this.server.emit('sale-updated', sales);
  }
}
