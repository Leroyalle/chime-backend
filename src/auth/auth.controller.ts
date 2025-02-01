import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import { EmailUsersService, UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { EntryDto } from './dto/entry-dto';

@Controller('/auth/email')
export class AuthController {
  constructor(
    protected readonly authService: AuthService,
    protected readonly usersService: UserService,
    protected readonly emailService: EmailService,
    protected readonly emailUserService: EmailUsersService,
    protected readonly jwtService: JwtService,
  ) {}
  @Post('/login')
  async login(@Body() body: EntryDto) {
    return await this.authService.login(body);
  }

  @Post('/sendCode')
  async sendCode(@Body() body: EntryDto) {
    return await this.authService.register(body);
  }

  @Post('verify')
  async verify(@Body() body: { userId: string; code: string }) {
    const isVerified = await this.emailService.verifyCode(body.userId, body.code);

    if (!isVerified) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const validUser = await this.usersService.findBaseUserByEmailUserId(body.userId);
    const token = this.jwtService.sign({ id: validUser.id, role: validUser.role });
    return { token };
  }
}
