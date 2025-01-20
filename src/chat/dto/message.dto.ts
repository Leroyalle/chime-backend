import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TextMessageBody } from './text-message-body';
import { PostMessageBody } from './post-message-body.dto';
import { MessageTypeEnum } from './message-type.enum';

export class Message {
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Object, {
    keepDiscriminatorProperty: true,
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
