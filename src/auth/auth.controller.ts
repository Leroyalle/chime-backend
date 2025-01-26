import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import {
  EmailUsersService,
  GoogleUsersService,
  TelegramUsersService,
  UserService,
} from 'src/user/user.service';
import { RolesClass } from 'types/types';
import { AuthService } from './auth.service';
import {
  EntryAdminDto,
  EntryDto,
  IGoogleAuthDto,
  IGoogleJwtDto,
  ITelegramAuthDto,
} from './dto/entry-dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth-guard';
import { hash } from 'argon2';

interface IAuthController {
  // TODO Change Interfaces abd args
  // login: (...args: any[]) => Promise<any>;
  // register: (...args: any[]) => Promise<any>;
  // getProfile: (...args: any[]) => Promise<any>;
}

@Controller('auth')
export class AuthController {
  constructor(
    protected readonly authService: AuthService,
    protected readonly usersService: UserService,
    protected readonly emailService: EmailService,
    protected readonly emailUserService: EmailUsersService,
    protected readonly telegramUsersService: TelegramUsersService,

    protected readonly googleAuthService: GoogleUsersService,

    protected readonly jwtService: JwtService,
  ) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return req.user;
  }
}

@Controller('/auth/email')
export class EmailAuthController extends AuthController implements IAuthController {
  // @UseGuards(LocalAuthGuard)
  // @Post('/login/admin')
  // async loginAdmin(@Body() body: EntryAdminDto, @Request() req) {
  //   console.log(body);
  //   console.log(req.user);
  //   const admin = await this.usersService.findUserById(req.user.userBaseId);
  //   console.log(admin);
  //   return await this.authService.login(admin);
  // }

  @Post('/login')
  async login(@Body() body: EntryDto) {
    return await this.authService.login(body);
  }

  @Post('/sendCode')
  async sendCode(@Body() body: EntryDto) {
    return await this.authService.register(body);
  }

  // @Post('recovery')
  // async recovery(@Body() body: { email: string }) {
  //   const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
  //   const user = await this.usersService.findValidateUserByEmail(body.email)

  //   if (!user) throw new NotFoundException('email not found')

  //   await this.emailService.createVerificationCode(user.id, verificationCode)
  //   await this.emailService.sendVerificationCode(user.email, verificationCode)

  //   return {
  //     userId: user.id
  //   }
  // }

  @Post('verify')
  async verify(@Body() body: { userId: string; code: string }) {
    const isVerified = await this.emailService.verifyCode(body.userId, body.code);

    if (!isVerified) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const validUser = await this.usersService.findBaseUserByEmailUserId(body.userId);
    console.log(validUser);

    const token = this.jwtService.sign({ id: validUser.id, role: validUser.role });

    return { token };
  }

  @Patch('changePassword')
  async changePassword(@Body() body: { newPassword: string; email: string }) {
    // const existingUserId = (await this.usersService.findOne(body.email)).id
    // return await this.usersService.changePassword(existingUserId, body.newPassword);
  }
}

@Controller('/auth/telegram')
export class TelegramAuthController extends AuthController {
  @Post('/login')
  async login(@Body() telegramData: ITelegramAuthDto, @Request() req) {
    // console.log(telegramData);
    // const user = await this.telegramUsersService.findOrCreate(telegramData);
    // return await this.authService.login(user);
  }
}

@Controller('/auth/google')
export class GoogleAuthController extends AuthController {
  @Post('/login')
  async login(@Body() googleData: IGoogleJwtDto, @Request() req) {
    // const decodedData: IGoogleAuthDto = this.jwtService.decode(googleData.credential);
    // console.log(decodedData);
    // const user = await this.googleAuthService.findOrCreate(decodedData);
    // console.log(user);
    // return await this.authService.login(user);
  }
}
