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
import { InternalServerErrorException, OnModuleInit, UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/auth/strategies/ws.strategy';
import { UserService } from 'src/user/user.service';
import { DatabaseService } from 'src/database/database.service';

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
@UseGuards(WsJwtAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private connectedSockets: string[] = [];

  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly dbService: DatabaseService,
  ) {}

  @WebSocketServer()
  server: Server;
  private users: Socket[] = [];

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(` --- Client connected: ${client.id}`);
    this.connectedSockets.push(client.id);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`--- Client disconnected: ${client.id}`);
    this.connectedSockets = this.connectedSockets.filter((id) => id !== client.id);

    client.disconnect();
  }

  @SubscribeMessage('checkData')
  async connect(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string }) {
    // console.log(client.data.userBaseId)
    const userBase = await this.userService.findUserById(client.userData.userBaseId);
    // console.log(userBase)

    console.log('ID', client.userData.userBaseId);

    const existingSocketWithUserId = this.connectedSockets.find((ws) => ws == client.id);

    console.log(existingSocketWithUserId);
    if (!existingSocketWithUserId) {
      this.connectedSockets.push(client.id);
    }

    const chats = await this.dbService.chat.findMany({
      where: {
        members: {
          some: {
            id: userBase.id,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    this.server.emit('checkData', chats);
  }

  @SubscribeMessage('post:new')
  async broadcastNewPost(@ConnectedSocket() client: Socket) {
    client.broadcast.emit('post:new', true);
  }

  // @SubscribeMessage('loadMessages')
  // async loadMessages(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() data: { chatId: string },
  // ) {
  //   if (!data && !data?.chatId) {
  //     // return handleWsError(client, "Invalid chat")

  //     return;
  //   }

  //   const messages = await this.dbService.message.findMany({
  //     where: {
  //       chatId: data.chatId,
  //     },
  //     include:{
  //       UserBase: true
  //     }
  //   });

  //   this.server.emit('loadMessages', messages);
  // }

  @SubscribeMessage('messages:post')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string; chatId: string },
  ): Promise<void> {
    try {
      console.log('Received data:', data);

      const UserBase = await this.userService.findUserById(client.userData.userBaseId);
      // console.log(UserBase)

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
        where: {
          id: data.chatId,
        },
        data: {
          lastMessageAt: new Date(),
        },
      });

      console.log('new:', newMessage);

      this.server.emit('messages:get', {
        chatId: data.chatId,
        message: newMessage,
        senderName: UserBase.name,
      });
    } catch (error) {
      console.log('Error [sendMessage]', error);
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

      this.server.emit('message:delete', {
        chatId: deletedMessage.chatId,
        messageId: deletedMessage.id,
      });
    } catch (error) {
      console.log('Error [deleteMessage]', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  @SubscribeMessage('messages:patch')
  async patchMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; patchedMessageBody: string },
  ) {
    try {
      console.log(data);
      //FIXME сделать проверку является ли сообщение пользователя этого чата

      const existingMessage = await this.dbService.message.findUnique({
        where: {
          id: data.messageId,
        },
      });

      if (!existingMessage) {
        console.log('Message not found');
        return;
      }

      const patchedMessage = await this.dbService.message.update({
        where: {
          id: data.messageId,
        },
        data: {
          body: data.patchedMessageBody,
        },
      });

      // _______Client Emit

      // this.server.emit('messages:patch', {
      //   // chatId: data.chatId,
      //   message: patchedMessage,
      // });
    } catch (error) {
      console.log('Error [patchMessage]', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // _________________________

  async onModuleInit() {
    setInterval(() => {
      console.log('Active sockets:', this.connectedSockets);
      // console.log('Active sockets:', this.connectedSockets.length);
    }, 10000);
  }
}
