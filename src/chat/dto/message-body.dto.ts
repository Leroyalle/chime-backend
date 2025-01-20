import { ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { TextMessageBody } from './text-message-body';
import { PostMessageBody } from './post-message-body.dto';
import { MessageTypeEnum } from './message-type.enum';

export class MessageBody {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TextMessageBody || PostMessageBody, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: TextMessageBody, name: MessageTypeEnum.TEXT },
        { value: PostMessageBody, name: MessageTypeEnum.POST },
      ],
    },
  })
  body: TextMessageBody | PostMessageBody;
}
