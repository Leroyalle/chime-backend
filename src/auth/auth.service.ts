import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { EmailService } from 'src/email/email.service';
import { EmailUsersService } from 'src/user/user.service';
import { RegisterDto } from './dto/register-dto';
import { AuthBody } from './dto/register-dto';

@Injectable()
export class AuthService {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly emailUserService: EmailUsersService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = Buffer.from(this.configService.get<string>('ENCRYPTION_KEY'), 'base64');
  }

  async validateUser(email: string, password: string) {
    const findUser = await this.emailUserService.findOne(email);

    if (!findUser) {
      throw new UnauthorizedException(`User not found`);
    }

    const passwordIsMatch = await argon2.verify(findUser.password, password);

    if (!passwordIsMatch) {
      throw new UnauthorizedException(`Invalid password or email`);
    }

    return findUser;
  }

  async login(body: AuthBody) {
    const findUser = await this.validateUser(body.email, body.password);

    return {
      token: this.jwtService.sign({ id: findUser.userBase.id, role: findUser.userBase.role }),
    };
  }

  async register(body: RegisterDto) {
    const findUser = await this.emailUserService.findOne(body.email);

    if (findUser) {
      throw new BadRequestException('Пользователь уже существует');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const createdUser = (await this.emailUserService.create(body)).EmailUser;

    await this.emailService.createVerificationCode(createdUser.id, verificationCode);
    await this.emailService.sendVerificationCode(createdUser.email, verificationCode);
    return {
      message:
        'Пользователь зарегистрирован. Пожалуйста, проверьте вашу электронную почту для получения кода подтверждения',
      verified: false,
      userId: createdUser.id,
      checkPassword: false,
    };
  }

  async handleExistingUser(user) {
    if (user.banned) throw new UnauthorizedException('You are banned');
    return { verified: true };
  }
}
