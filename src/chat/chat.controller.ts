import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { UserId } from 'src/userid.decorator';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getUserChats(@UserId() userId: string, @Query('query') query: string = '') {
    return this.chatService.getUserChats(userId, query);
  }

  @Get('info/:id')
  async getChatById(@UserId() userId: string, @Param('id') chatId: string) {
    return this.chatService.getChatById(userId, chatId);
  }

  @Get('create/:id')
  async createChat(@UserId() userId: string, @Param('id') recipientId: string) {
    return this.chatService.createChat(userId, recipientId);
  }

  @Get(':id')
  async getChatMessagesByChatId(
    @UserId() userId: string,
    @Param('id') chatId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    return this.chatService.getChatMessagesByChatId(userId, chatId, +page, +perPage);
  }
}
