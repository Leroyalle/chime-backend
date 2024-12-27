import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ChatService {
  protected chatDb: DatabaseService['chat'];
  protected messageDb: DatabaseService['message'];

  constructor(private readonly databaseService: DatabaseService) {
    this.chatDb = databaseService.chat;
    this.messageDb = databaseService.message;
  }

  async getUserChats(userId: string) {
    try {
      const data = await this.chatDb.findMany({
        where: {
          members: {
            some: {
              id: userId,
            },
          },
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      });

      console.log('CHATS:', data);
      return data;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getChatMessagesByChatId(
    userId: string,
    chatId: string,
    page: number,
    perPage: number,
  ) {
    try {
      const messages = await this.messageDb.findMany({
        where: {
          chatId,
        },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const totalItems = await this.messageDb.count({ where: { chatId } });
      const totalPages = Math.ceil(totalItems / perPage);

      return {
        data: messages,
        currentPage: page,
        totalPages,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
