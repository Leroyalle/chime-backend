import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2'
import { JwtService } from "@nestjs/jwt"
import { EmailUsersService, UsersService } from 'src/users/users.service';
import { DatabaseService } from 'src/database/database.service';
import { ConfigService } from '@nestjs/config';
import { IBasicUser } from 'src/types/types';


@Injectable()
export class AuthService {
  private readonly encryptionKey: Buffer;


  constructor(
    private readonly usersService: UsersService,
    private readonly emailUserService: EmailUsersService,
    private readonly jwtService: JwtService,
    private databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {

    this.encryptionKey = Buffer.from(this.configService.get<string>('ENCRYPTION_KEY'), 'base64')
  }



  async validateUser(email: string, password: string) {
    const user = await this.emailUserService.findOne(email);
    console.log(user.password, password)
    const passwordIsMatch = await argon2.verify(user.password, password)

    if (user && passwordIsMatch) {
      return user
    }
    throw new UnauthorizedException(`Invalid password: ${password}`)
  }


  async login(user: IBasicUser) {
    const { id, role } = user
    // const { email } = user.EmailUser
    return {
      user,
      token: this.jwtService.sign({ id, role }),
    }
  }

  async handleExistingUser(user, organization) {
    if (user.banned) throw new UnauthorizedException('You are banned')
    return { verified: true }
  }




}
