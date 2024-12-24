import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { NotAcceptableException, OnModuleInit, Req, UseFilters, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { WsJwtAuthGuard } from 'src/auth/strategies/ws.strategy';
import { UserService } from 'src/user/user.service';
import { DatabaseService } from 'src/database/database.service';

export interface Message {
  id: string,
  socketId: string,
  body: string,
  time: string,
  userId: string
}

@WebSocketGateway({
  namespace: "chat", cors: {
    origin: "*"
  }
})
@UseGuards(WsJwtAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  chatId = "46369394-7361-48b9-83fd-a0dec87cd56b"

  constructor(private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly dbService: DatabaseService
  ) { }

  @WebSocketServer()
  server: Server;
  private users: Socket[] = [];


  handleConnection(client: any) {
    // console.log(` --- Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // console.log(`--- Client disconnected: ${client.id}`);
    // delete this.players[client.id];

  }



  @SubscribeMessage('checkData')
  async connect(@ConnectedSocket() client: Socket) {
    console.log(client.data.userBaseId)



    const userBase = await this.userService.findUserById(client.data.userBaseId)
    console.log(userBase)

    await this.dbService.chat.update({
      where: {
        id: this.chatId
      },
      data: {
        members: {
          connect: { id: userBase.id }
        }
      }
    });


    const messages = await this.dbService.message.findMany({
      where: {
        chatId: this.chatId
      }
    })

    this.server.emit('checkData');
    // this.server.emit('message', messages)
  }



  @SubscribeMessage("loadMessages")
  async loadMessages(@ConnectedSocket() client: Socket) {
    const messages = await this.dbService.message.findMany({
      where: {
        chatId: this.chatId
      }
    })

    this.server.emit('loadMessages', messages)



  }


  @SubscribeMessage('message')
  async sendMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { message: string }): Promise<void> {
    // console.log(`Client`, client);
    console.log('Received data:', data);

    const connectedUserBase = await this.userService.findUserById(client.data.userBaseId)
    console.log(connectedUserBase)

    const newMessage = await this.dbService.message.create({
      data: {
        chatId: "46369394-7361-48b9-83fd-a0dec87cd56b",
        userBaseId: connectedUserBase.id,
        body: data.message
      }
    })

    //  { messages: [newMessage], onload: false}
    this.server.emit('message', [newMessage]);
  }

  async onModuleInit() {
    // await this.dbService.chat.deleteMany()


    // const createdChat = await this.dbService.chat.create({data: {}})
    // console.log(createdChat)


  }

}
