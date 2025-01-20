import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UserService } from 'src/user/user.service';

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
    try {
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

      const randInt = (100 + Math.random() * 100000).toFixed(0);

      const createdChat = await this.dbService.chat.create({
        data: {
          name: `chat ${randInt}`,
          imageUrl: `https://avatars.githubusercontent.com/u/${randInt}?v=4`,
          members: {
            connect: [{ id: UserBase.id }, { id: recipientId }],
          },
        },
        include: {
          members: true,
        },
      });

      return { chatId: createdChat.id };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getUserChats(userId: string, query: string) {
    console.log(query);
    try {
      const data = await this.chatDb.findMany({
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
        include: {
          members: true,
          lastMessage: true,
        },
        orderBy: {
          lastMessage: {
            createdAt: 'desc',
          },
        },
      });

      const chatsWithName = data.map((chat) => ({
        ...chat,
        name: chat.members
          .filter((member) => member.id !== userId)
          .map((member) => member.name)
          .join(', '),
      }));
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
          lastMessage: true,
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

      return chatsWithName;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getChatMessagesByChatId(userId: string, chatId: string, page: number, perPage: number) {
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
              name: true,
              avatar: true,
            },
          },
          post: {
            include: {
              author: {
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
