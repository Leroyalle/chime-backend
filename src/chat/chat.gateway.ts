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
import {
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
  UseGuards,
} from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/auth/strategies/ws.strategy';
import { UserService } from 'src/user/user.service';
import { DatabaseService } from 'src/database/database.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

declare module 'socket.io' {
  interface Socket {
    userData: {
      userBaseId?: string;
    };
  }
}

export interface Message {
  id: string;
  socketId: string;
  body: string;
  time: string;
  userId: string;
}

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
// @UseGuards(WsJwtAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  // private connectedSockets: string[] = [];

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

  @SubscribeMessage('checkData')
  async connect(@ConnectedSocket() client: Socket) {
    console.log('ID', client.userData.userBaseId);

    const userId = client.userData.userBaseId;

    if (!userId) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }

    const chats = await this.dbService.chat.findMany({
      where: {
        members: {
          some: {
            id: userId,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    client.emit('checkData', chats);
  }

  @SubscribeMessage('post:new')
  async broadcastNewPost(@ConnectedSocket() client: Socket) {
    client.broadcast.emit('post:new', true);
  }

  @SubscribeMessage('messages:post')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string; chatId: string },
  ): Promise<void> {
    try {
      console.log('SendMessage event triggered');
      const UserBase = await this.userService.findUserById(client.userData.userBaseId);

      const newMessage = await this.dbService.message.create({
        data: {
          chatId: data.chatId,
          userBaseId: UserBase.id,
          body: data.message,
        },
        include: {
          UserBase: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await this.dbService.chat.update({
        where: { id: data.chatId },
        data: {
          lastMessage: {
            connect: { id: newMessage.id },
          },
        },
      });

      const chat = await this.dbService.chat.findUnique({
        where: {
          id: data.chatId,
        },
        include: {
          members: {
            select: {
              id: true,
            },
          },
          lastMessage: true,
        },
      });

      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      const memberIds = chat.members.map((member) => member.id);

      memberIds.forEach((memberId) => {
        const connections = this.activeConnections.get(memberId);
        if (connections) {
          connections.forEach((socketId) => {
            console.log('socketId', socketId);
            this.server.to(socketId).emit('messages:get', {
              chat,
              message: newMessage,
              senderName: UserBase.name,
            });
          });
        }
      });
    } catch (error) {
      console.log('Error [sendMessage]', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  @SubscribeMessage('messages:patch')
  async updateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; messageBody: string },
  ) {
    try {
      const findMessage = await this.dbService.message.findFirst({
        where: {
          id: data.messageId,
        },
      });

      if (!findMessage) {
        console.log('Message not found');
        return;
      }

      const updatedMessage = await this.dbService.message.update({
        where: {
          id: data.messageId,
        },
        data: {
          body: data.messageBody,
        },
        include: {
          UserBase: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.server.emit('messages:patch', {
        chatId: updatedMessage.chatId,
        message: updatedMessage,
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @SubscribeMessage('messages:delete')
  async deleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      console.log(data);

      //FIXME: сделать проверку является ли сообщение пользователя этого чата

      const existingMessage = await this.dbService.message.findUnique({
        where: {
          id: data.messageId,
        },
      });

      if (!existingMessage) {
        console.log('Message not found');
        return;
      }

      const deletedMessage = await this.dbService.message.delete({
        where: {
          id: data.messageId,
        },
      });

      // _______Client Emit

      this.server.emit('messages:delete', {
        chatId: deletedMessage.chatId,
        messageId: deletedMessage.id,
      });
    } catch (error) {
      console.log('Error [deleteMessage]', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // @SubscribeMessage('messages:patch')
  // async patchMessage(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() data: { messageId: string; patchedMessageBody: string },
  // ) {
  //   try {
  //     console.log(data);
  //     //FIXME сделать проверку является ли сообщение пользователя этого чата

  //     const existingMessage = await this.dbService.message.findUnique({
  //       where: {
  //         id: data.messageId,
  //       },
  //     });

  //     if (!existingMessage) {
  //       console.log('Message not found');
  //       return;
  //     }

  //     const patchedMessage = await this.dbService.message.update({
  //       where: {
  //         id: data.messageId,
  //       },
  //       data: {
  //         body: data.patchedMessageBody,
  //       },
  //     });

  //     // _______Client Emit

  //     // this.server.emit('messages:patch', {
  //     //   // chatId: data.chatId,
  //     //   message: patchedMessage,
  //     // });
  //   } catch (error) {
  //     console.log('Error [patchMessage]', error);
  //     throw new InternalServerErrorException(error.message);
  //   }
  // }

  // _________________________

  async onModuleInit() {
    setInterval(() => {
      console.log('Active sockets:', this.activeConnections);
      // console.log('Active sockets:', this.connectedSockets.length);
    }, 10000);
  }
}
