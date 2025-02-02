import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { DatabaseService } from 'src/database/database.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Message } from './dto/message.dto';
import { MessageTypeEnum } from './dto/message-type.enum';

declare module 'socket.io' {
  interface Socket {
    userData: {
      userBaseId?: string;
    };
  }
}

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private activeConnections: Map<string, Set<string>> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @WebSocketServer()
  server: Server;
  private users: Socket[] = [];

  async handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (!payload || !payload.id) {
        client.disconnect(true);
        return;
      }

      const findUser = await this.userService.findUserById(payload.id);
      if (!findUser) {
        client.disconnect(true);
        return;
      }

      if (!client.userData) {
        client.userData = {};
      }
      client.userData.userBaseId = payload.id;

      if (!this.activeConnections.has(payload.id)) {
        this.activeConnections.set(payload.id, new Set());
      }
      this.activeConnections.get(payload.id).add(client.id);

      this.server.emit('user_connected', { userId: payload.id });
    } catch (err) {
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.userData?.userBaseId;

    if (userId && this.activeConnections.has(userId)) {
      const connections = this.activeConnections.get(userId);
      connections.delete(client.id);

      if (connections.size === 0) {
        this.activeConnections.delete(userId);
        this.server.emit('user_disconnected', { userId });
      }
    }
  }

  @SubscribeMessage('post:new')
  async broadcastNewPost(@ConnectedSocket() client: Socket) {
    client.broadcast.emit('post:new', true);
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage('messages:post')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: Message,
  ): Promise<void> {
    const UserBase = await this.userService.findUserById(client.userData.userBaseId);

    if (data.body.type === MessageTypeEnum.TEXT) {
      const { chat, message } = await this.chatService.storeMessageInChat(data, UserBase.id);

      chat.members.forEach((member) => {
        const connections = this.activeConnections.get(member.id);
        if (connections) {
          connections.forEach((socketId) => {
            this.server.to(socketId).emit('messages:get', {
              chat,
              message,
            });
          });
        }
      });
      return;
    }

    if (data.body.type === MessageTypeEnum.POST) {
      const { chats, findMessages } = await this.chatService.storeRepostInChats(
        data,
        client.userData.userBaseId,
      );

      chats.forEach((chat) =>
        chat.members.forEach((member) => {
          const connections = this.activeConnections.get(member.id);
          if (connections) {
            connections.forEach((socketId) => {
              this.server.to(socketId).emit('messages:get', {
                chat,
                message: findMessages.find((msg) => msg.chatId === chat.id),
              });
            });
          }
        }),
      );
      return;
    }
  }

  @SubscribeMessage('messages:patch')
  async updateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; messageBody: string },
  ) {
    const { id: userId } = await this.userService.findUserById(client.userData.userBaseId);
    const { chat, message } = await this.chatService.storeUpdatedMessage(data, userId);

    this.server.emit('messages:patch', {
      chat,
      message,
    });
  }

  @SubscribeMessage('messages:delete')
  async deleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const { id: userId } = await this.userService.findUserById(client.userData.userBaseId);
    const { chat, message } = await this.chatService.deleteMessage(data, userId);

    this.server.emit('messages:delete', {
      chat,
      message,
    });
  }
}
