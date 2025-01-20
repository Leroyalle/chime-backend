import { MessageTypeEnum } from './message-type.enum';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class PostMessageBody {
  @IsArray()
  chatIds: string[];

  @IsEnum(MessageTypeEnum)
  type: MessageTypeEnum.POST;

  @IsOptional()
  @IsString()
  content: string | null;

  @IsString()
  postId: string;
}
