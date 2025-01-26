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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
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

  @UsePipes(new ValidationPipe())
  @SubscribeMessage('messages:post')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: Message,
  ): Promise<void> {
    try {
      console.log('MESSAGEDATA:', data);
      const UserBase = await this.userService.findUserById(client.userData.userBaseId);
      if (data.body.type === MessageTypeEnum.TEXT) {
        console.log('[USER-BASE]', UserBase);
        const message = await this.dbService.message.create({
          data: {
            chatId: data.body.chatId,
            userBaseId: UserBase.id,
            content: data.body.content,
            type: data.body.type,
          },
          include: {
            UserBase: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        });

        const findChat = await this.dbService.chat.findUnique({
          where: {
            id: data.body.chatId,
          },
        });

        if (!findChat) {
          throw new NotFoundException('Chat not found');
        }

        const chat = await this.dbService.chat.update({
          where: { id: findChat.id },
          data: {
            lastMessage: {
              connect: { id: message.id },
            },
          },
          include: {
            members: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            lastMessage: true,
          },
        });

        const memberIds = chat.members.map((member) => member.id);

        const chatWithName = {
          ...chat,
          recipient: chat.members.find((member) => member.id !== UserBase.id),
          avatar: chat.members.find((member) => member.id !== UserBase.id)?.avatar,
          name: chat.members
            .filter((member) => member.id !== UserBase.id)
            .map((member) => member.name)
            .join(', '),
        };

        memberIds.forEach((memberId) => {
          const connections = this.activeConnections.get(memberId);
          if (connections) {
            connections.forEach((socketId) => {
              this.server.to(socketId).emit('messages:get', {
                chat: chatWithName,
                message,
              });
            });
          }
        });
        return;
      }

      if (data.body.type === MessageTypeEnum.POST) {
        const findPost = await this.dbService.post.findUnique({
          where: {
            id: data.body.postId,
          },
        });

        if (!findPost) {
          throw new NotFoundException('Post not found');
        }

        const messageCreationResult = await this.dbService.message.createMany({
          data: data.body.chatIds.map((chatId) => ({
            chatId,
            userBaseId: UserBase.id,
            content: data.body.content,
            type: data.body.type,
            postId: findPost.id,
          })),
        });

        const findMessages = await this.dbService.message.findMany({
          where: {
            chatId: { in: data.body.chatIds },
            userBaseId: UserBase.id,
            content: data.body.content,
            type: data.body.type,
            postId: findPost.id,
          },
          include: {
            post: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
                images: true,
              },
            },
            UserBase: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: messageCreationResult.count,
        });

        await this.dbService.$transaction(
          data.body.chatIds.map((chatId, index) =>
            this.dbService.chat.update({
              where: { id: chatId },
              data: {
                lastMessage: {
                  connect: { id: findMessages[index].id },
                },
              },
            }),
          ),
        );

        const chats = await this.dbService.chat.findMany({
          where: {
            id: {
              in: data.body.chatIds,
            },
          },
          include: {
            members: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            lastMessage: true,
          },
        });

        const chatsWithName = chats.map((chat) => ({
          ...chat,
          recipient: chat.members.find((member) => member.id !== UserBase.id),
          avatar: chat.members.find((member) => member.id !== UserBase.id)?.avatar,
          name: chat.members
            .filter((member) => member.id !== UserBase.id)
            .map((member) => member.name)
            .join(', '),
        }));

        chatsWithName.forEach((chat) =>
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
      }
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
          content: data.messageBody,
        },
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
              images: true,
            },
          },
          UserBase: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      const findChat = await this.dbService.chat.findUnique({
        where: {
          id: findMessage.chatId,
        },
      });

      if (!findChat) {
        throw new NotFoundException('Chat not found');
      }

      const chat = await this.dbService.chat.update({
        where: { id: findMessage.chatId },
        data: {
          lastMessage: {
            connect:
              findChat.lastMessageId === data.messageId
                ? { id: updatedMessage.id }
                : { id: findChat.lastMessageId },
          },
        },

        include: {
          members: {
            select: {
              id: true,
            },
          },
          lastMessage: {
            include: {
              UserBase: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      console.log({
        chat,
        message: updatedMessage,
      });

      this.server.emit('messages:patch', {
        chat,
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

      const existingMessage = await this.dbService.message.findUnique({
        where: { id: data.messageId },
      });

      if (!existingMessage) {
        console.log('Message not found');
        return;
      }

      const deletedMessage = await this.dbService.message.delete({
        where: { id: data.messageId },
      });

      const newLastMessage = await this.dbService.message.findFirst({
        where: { chatId: deletedMessage.chatId },
        orderBy: { createdAt: 'desc' },
      });

      const updatedChat = await this.dbService.chat.update({
        where: { id: deletedMessage.chatId },
        data: {
          lastMessage: newLastMessage
            ? { connect: { id: newLastMessage.id } }
            : { disconnect: true },
        },
        include: {
          members: {
            select: {
              id: true,
            },
          },
          lastMessage: {
            include: {
              UserBase: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      console.log({
        chat: updatedChat,
        message: deletedMessage,
      });

      this.server.emit('messages:delete', {
        chat: updatedChat,
        message: deletedMessage,
      });
    } catch (error) {
      console.log('Error [deleteMessage]', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async onModuleInit() {
    setInterval(() => {
      // console.log('Active sockets:', this.activeConnections);
      // console.log('Active sockets:', this.connectedSockets.length);
    }, 10000);
  }
}
