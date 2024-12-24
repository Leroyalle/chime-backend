import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { UserService } from 'src/user/user.service';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly userService: UserService
    ) { }

    private secretKey = this.configService.get('JWT_SECRET');

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();
        const token = client.handshake.auth?.token;

        if (!token) {
            client.emit('unauthorized', 'Token is missing');
            client.disconnect(true)
            console.log('Token is missing')
            return
        }

        try {
            const payload = this.jwtService.verify(token, { secret: this.secretKey })
            // console.log('JWT Payload:', payload)

            const user = await this.userService.findUserById(payload.id)

            if (!user) {
                client.emit('unauthorized', 'User not found');
                return
            }

            client.data.userBaseId = payload.id


            console.log("client data", client.data)
            return true
        } catch (err) {
            console.error('Token verification failed');
            client.emit('unauthorized', 'Invalid token');
            client.disconnect(true)
            console.log('Invalid token')
            // throw new UnauthorizedException('Invalid token');
        }
    }
}
