import { IsEnum, IsString } from 'class-validator';
import { MessageTypeEnum } from './message-type.enum';

export class TextMessageBody {
  @IsString()
  chatId: string;

  @IsEnum(MessageTypeEnum)
  type: MessageTypeEnum.TEXT;

  @IsString()
  content: string;
}
