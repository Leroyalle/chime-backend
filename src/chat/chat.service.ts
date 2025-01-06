import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
          members: true,
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

      const chatsWithName = data.map((chat) => ({
        ...chat,
        name: chat.members
          .filter((member) => member.id !== userId)
          .map((member) => member.name)
          .join(', '),
      }));

      console.log('CHATS:', chatsWithName);
      return chatsWithName;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getChatById(userId: string, chatId: string) {
    try {
      const chat = await this.chatDb.findUnique({
        where: {
          id: chatId,
        },
        include: {
          members: true,
        },
      });

      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      const chatsWithName = {
        ...chat,
        name: chat.members
          .filter((member) => member.id !== userId)
          .map((member) => member.name)
          .join(', '),
      };

      console.log('CHAT:', chatsWithName);
      return chatsWithName;
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

        include: {
          UserBase: {
            select: {
              id: true,
              name: true
            }
          }
        }
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
