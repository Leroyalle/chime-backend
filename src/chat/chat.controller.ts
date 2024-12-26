import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { UserId } from 'src/userid.decorator';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getUserChats(@UserId() userId: string) {
    return this.chatService.getUserChats(userId);
  }

  @Get(':id')
  async getChatMessagesByChatId(
    @UserId() userId: string,
    @Param('id') chatId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    return this.chatService.getChatMessagesByChatId(
      userId,
      chatId,
      +page,
      +perPage,
    );
  }
}
