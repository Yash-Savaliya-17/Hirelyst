import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {LoggerService} from "../../shared/logger/logger.service";
import * as process from "node:process";
import {QuizService} from "./quiz.service";

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL
    }
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    // server.broadcast.emit to broadcast message to all connected clients
    // client.broadcast.emit to broadcast message to all connected clients except the sender

    // to broadcast message to all connected clients
    constructor(private logger: LoggerService, private quizService: QuizService) {
    }

    handleDisconnect(client: any) {
        this.logger.debug(`Client disconnected: ${client.id}`);
    }

    handleConnection(client: any, ...args: any[]) {
        this.logger.debug(`Client connected: ${client.id}`);
    }

    @SubscribeMessage('save-answers')
    handleMessage(client: Socket, message: any) {
        client.emit('response', "Hello from server");
    }

}
