import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UserService } from 'src/user/user.service';
import { Message } from './dto/message.dto';
import { MessageTypeEnum } from './dto/message-type.enum';
import { chatInclude, messageInclude } from './constants';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatService {
  protected chatDb: DatabaseService['chat'];
  protected messageDb: DatabaseService['message'];

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService,
    private readonly dbService: DatabaseService,
  ) {
    this.chatDb = databaseService.chat;
    this.messageDb = databaseService.message;
  }

  async createChat(userId: string, recipientId: string) {
    const UserBase = await this.userService.findUserById(userId);

    if (!UserBase) {
      throw new NotFoundException('User not found');
    }

    const existingChat = await this.dbService.chat.findFirst({
      where: {
        AND: [
          { members: { some: { id: UserBase.id } } },
          { members: { some: { id: recipientId } } },
        ],
      },
      include: {
        members: true,
      },
    });

    if (existingChat) {
      return { chatId: existingChat.id };
    }

    if (UserBase.id == recipientId) {
      throw new BadRequestException('Cannot create a chat with yourself');
    }

    const createdChat = await this.dbService.chat.create({
      data: {
        name: `${userId}-${recipientId}`.slice(0, 15),
        members: {
          connect: [{ id: UserBase.id }, { id: recipientId }],
        },
      },
      include: {
        members: true,
      },
    });

    return { chatId: createdChat.id };
  }

  async getUserChats(userId: string, query: string) {
    const chats = await this.chatDb.findMany({
      where: {
        AND: [
          {
            members: {
              some: {
                id: userId,
              },
            },
          },
          {
            members: {
              some: {
                AND: [
                  {
                    id: {
                      not: userId,
                    },
                  },
                  {
                    name: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      include: chatInclude,
      orderBy: {
        lastMessage: {
          createdAt: 'desc',
        },
      },
    });

    return chats;
  }

  async getChatById(userId: string, chatId: string) {
    return await this.checkIfUserIsInChat(userId, chatId);
  }

  async getChatMessagesByChatId(
    userId: string,
    chatId: string,
    parsedCursor: { id: string; createdAt: Date } | null,
    take: number = 20,
  ) {
    await this.checkIfUserIsInChat(userId, chatId);

    const where: Prisma.MessageWhereInput = { chatId };

    if (parsedCursor) {
      where.OR = [
        { createdAt: { lt: parsedCursor.createdAt } },
        {
          AND: [{ createdAt: parsedCursor.createdAt }, { id: { lt: parsedCursor.id } }],
        },
      ];
    }

    const messages = await this.messageDb.findMany({
      where,
      take: take + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: messageInclude,
    });

    const hasNextPage = messages.length > take;
    const trimmedMessages = hasNextPage ? messages.slice(0, -1) : messages;

    const lastMessage = trimmedMessages[trimmedMessages.length - 1];
    const nextCursor = lastMessage
      ? `${lastMessage.createdAt.toISOString()}|${lastMessage.id}`
      : null;

    return {
      data: trimmedMessages,
      nextCursor,
      hasNextPage,
    };
  }

  async storeMessageInChat(data: Message, userId: string) {
    if (data.body.type === MessageTypeEnum.TEXT) {
      const message = await this.dbService.message.create({
        data: {
          chatId: data.body.chatId,
          userBaseId: userId,
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

      const findChat = await this.checkIfUserIsInChat(userId, message.chatId);

      const chat = await this.dbService.chat.update({
        where: { id: findChat.id },
        data: {
          lastMessage: {
            connect: { id: message.id },
          },
        },
        include: chatInclude,
      });

      return { chat, message };
    }
  }

  async storeRepostInChats(data: Message, userId: string) {
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
          userBaseId: userId,
          content: data.body.content,
          type: data.body.type,
          postId: findPost.id,
        })),
      });

      const findMessages = await this.dbService.message.findMany({
        where: {
          chatId: { in: data.body.chatIds },
          userBaseId: userId,
          content: data.body.content,
          type: data.body.type,
          postId: findPost.id,
        },
        include: messageInclude,
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
          AND: [{ id: { in: data.body.chatIds } }, { members: { some: { id: userId } } }],
        },
        include: chatInclude,
      });

      return { chats, findMessages };
    }
  }

  async storeUpdatedMessage(data: { messageId: string; messageBody: string }, userId: string) {
    const findMessage = await this.checkIfMessageBelongsToUser(userId, data.messageId);
    const findChat = await this.checkIfUserIsInChat(userId, findMessage.chatId);

    const updatedMessage = await this.dbService.message.update({
      where: {
        id: data.messageId,
      },
      data: {
        content: data.messageBody,
      },
      include: messageInclude,
    });

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
      include: chatInclude,
    });

    return { chat, message: updatedMessage };
  }

  async deleteMessage(data: { messageId: string }, userId: string) {
    await this.checkIfMessageBelongsToUser(userId, data.messageId);

    const deletedMessage = await this.dbService.message.delete({
      where: { id: data.messageId },
    });

    console.log('DELETED_MESSAGE:', deletedMessage);

    const newLastMessage = await this.dbService.message.findFirst({
      where: { chatId: deletedMessage.chatId },
      orderBy: { createdAt: 'desc' },
    });

    const updatedChat = await this.dbService.chat.update({
      where: { id: deletedMessage.chatId },
      data: {
        lastMessage: newLastMessage ? { connect: { id: newLastMessage.id } } : { disconnect: true },
      },
      include: chatInclude,
    });

    return { chat: updatedChat, message: deletedMessage };
  }

  async checkIfUserIsInChat(userId: string, chatId: string) {
    const chat = await this.dbService.chat.findFirst({
      where: {
        AND: [{ id: chatId }, { members: { some: { id: userId } } }],
      },
      include: chatInclude,
    });

    if (!chat) {
      throw new BadRequestException('Chat not found');
    }

    return chat;
  }

  async checkIfMessageBelongsToUser(userId: string, messageId: string) {
    const message = await this.dbService.message.findFirst({
      where: {
        AND: [{ id: messageId }, { userBaseId: userId }],
      },
    });

    if (!message) {
      throw new BadRequestException('Message not found');
    }

    return message;
  }
}
