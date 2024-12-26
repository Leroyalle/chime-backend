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
  NotAcceptableException,
  OnModuleInit,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { WsJwtAuthGuard } from 'src/auth/strategies/ws.strategy';
import { UserService } from 'src/user/user.service';
import { DatabaseService } from 'src/database/database.service';
import handleWsError from 'utils/utils';

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
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
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

    // console.log(client.data.userBaseId)

    // client.disconnect()

    // this.connectedSockets.push(client.id)

    // this.server.emit('checkData')
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`--- Client disconnected: ${client.id}`);
    this.connectedSockets = this.connectedSockets.filter(
      (id) => id !== client.id,
    );

    client.disconnect();
  }

  @SubscribeMessage('checkData')
  async connect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    // console.log(client.data.userBaseId)
    const userBase = await this.userService.findUserById(
      client.userData.userBaseId,
    );
    // console.log(userBase)\

    console.log(client.userData.userBaseId);

    const existingSocketWithUserId = this.connectedSockets.find(
      (ws) => ws == client.id,
    );

    console.log(existingSocketWithUserId);
    if (!existingSocketWithUserId) {
      this.connectedSockets.push(client.id);
    }

    let chatData = null;
    if (data && data.chatId) {
      chatData = await this.dbService.chat.findUnique({
        where: { id: data.chatId },
        include: { members: true },
      });
    }

    // if (data && data.chatId) {
    //   console.log("update")
    //   console.log(data)
    //   chatData = await this.dbService.chat.update({
    //     where: {
    //       id: data.chatId
    //     },
    //     data: {
    //       members: {
    //         connect: { id: userBase.id }
    //       }
    //     },
    //     include: {
    //       members: true
    //     }
    //   })
    // }

    this.server.emit('checkData', { chatData, userChats: userBase.Chats });
  }

  @SubscribeMessage('createChat')
  async createChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: string },
  ) {
    console.log('Received data:', data);

    const UserBase = await this.userService.findUserById(
      client.userData.userBaseId,
    );

    const existingChat = await this.dbService.chat.findFirst({
      where: {
        AND: [
          { members: { some: { id: UserBase.id } } },
          { members: { some: { id: data.recipientId } } },
        ],
      },
      include: {
        members: true,
      },
    });

    if (existingChat) {
      this.server.emit('error', 'Chat already exists');
      client.disconnect(true);
      return;
    }

    if (UserBase.id == data.recipientId) {
      this.server.emit('error', 'Cannot create a chat with yourself');
      return;
    }

    const randInt = (100 + Math.random() * 100000).toFixed(0);

    const createdChat = await this.dbService.chat.create({
      data: {
        name: `chat ${randInt}`,
        imageUrl: `https://avatars.githubusercontent.com/u/${randInt}?v=4`,
        members: {
          connect: [{ id: UserBase.id }, { id: data.recipientId }],
        },
      },
      include: {
        members: true,
      },
    });

    this.server.emit('createChat', createdChat);
  }

  @SubscribeMessage('loadMessages')
  async loadMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!data && !data?.chatId) {
      // return handleWsError(client, "Invalid chat")

      return;
    }

    const messages = await this.dbService.message.findMany({
      where: {
        chatId: data.chatId,
      },
    });

    this.server.emit('loadMessages', messages);
  }

  @SubscribeMessage('messages:post')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string; chatId: string },
  ): Promise<void> {
    try {
      console.log('Received data:', data);

      const UserBase = await this.userService.findUserById(
        client.userData.userBaseId,
      );
      // console.log(UserBase)

      const newMessage = await this.dbService.message.create({
        data: {
          chatId: data.chatId,
          userBaseId: UserBase.id,
          body: data.message,
        },
      });

      console.log('new:', newMessage);

      this.server.emit('messages:get', {
        chatId: data.chatId,
        message: newMessage,
      });
    } catch (error) {
      console.log('Error [sendMessage]', error);
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
