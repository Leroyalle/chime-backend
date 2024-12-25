import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { UserService } from 'src/user/user.service';
import handleWsError from 'utils/utils';

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

        // console.log(token);

        if (!token) return handleWsError(client, 'Invalid token')


        try {
            const payload = this.jwtService.verify(token, { secret: this.secretKey })
            console.log('JWT Payload:', payload)

            if(!payload){
                return handleWsError(client, 'Invalid token')
            }

            if (!client.userData) {
                client.userData = {} 
            }


            // console.log(payload.id)
            const user = await this.userService.findUserById(payload.id);
            // console.log(user)

            if (!user) return handleWsError(client, 'User not found')

            client.userData.userBaseId = payload.id
            return true
        } catch (err) {
            handleWsError(client, 'Invalid token')
            // console.error('JWT error:', err)
            
            return false
        }
    }
}
