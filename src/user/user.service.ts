import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { RegisterDto } from 'src/auth/dto/register-dto';
import { DatabaseService } from 'src/database/database.service';
import { UpdateUserDto } from './dto/update-user-dto';
import { FollowService } from 'src/follow/follow.service';
import { nanoid } from 'nanoid';

@Injectable()
export class UserService {
  protected userBaseDb: DatabaseService['userBase'];
  protected emailUsersDb: DatabaseService['emailUser'];
  protected telegramUsersDb: DatabaseService['telegramUser'];
  protected googleUsersDb: DatabaseService['googleUser'];

  constructor(
    private dbService: DatabaseService,
    private readonly followService: FollowService,
  ) {
    this.userBaseDb = dbService.userBase;
    this.emailUsersDb = dbService.emailUser;
    this.telegramUsersDb = dbService.telegramUser;
    this.googleUsersDb = dbService.googleUser;
  }

  async findUserById(id: string) {
    const user = await this.userBaseDb.findUnique({
      where: { id },
      include: {
        EmailUser: true,
        TelegramUser: true,
        GoogleUser: true,
        Chats: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserByIdWithFollow(findId: string, userId: string) {
    const findUser = await this.userBaseDb.findUnique({
      where: { id: findId },
      include: {
        EmailUser: true,
        TelegramUser: true,
        GoogleUser: true,
        followers: true,
        following: true,
      },
    });

    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    const isFollowing = await this.followService.findFollow(userId, findId);
    const followerCount = await this.followService.findCountFollowers(findId);
    const followingCount = await this.followService.findCountFollowing(findId);

    return {
      ...findUser,
      isFollowing: !!isFollowing,
      followerCount,
      followingCount,
    };
  }

  async findBaseUserByEmailUserId(userId: string) {
    const emailUser = await this.emailUsersDb.findUnique({
      where: { id: userId },
      include: {
        userBase: true,
      },
    });

    return await this.findUserById(emailUser.userBaseId);
  }

  async findAll(query?: string) {
    return await this.userBaseDb.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        EmailUser: true,
        TelegramUser: true,
        GoogleUser: true,
        followers: true,
        following: true,
      },
    });
  }

  async update(userId: string, updateUserDto: UpdateUserDto, avatarUrl: string | undefined) {
    return await this.userBaseDb.update({
      where: { id: userId },
      data: {
        ...updateUserDto,
        avatar: avatarUrl,
      },
    });
  }
}

@Injectable()
export class EmailUsersService extends UserService {
  async create(createUserDto: RegisterDto) {
    const existingUser = await this.findOne(createUserDto.email);

    if (existingUser) {
      throw new BadRequestException(`User already exists`);
    }

    const createdUser = await this.userBaseDb.create({
      data: {
        name: createUserDto.name,
        alias: nanoid(8),
        EmailUser: {
          create: {
            email: createUserDto.email,
            password: await argon2.hash(createUserDto.password),
          },
        },
      },
      include: {
        EmailUser: true,
      },
    });

    return createdUser;
  }

  async changePassword(userId: string, password: string) {
    return await this.emailUsersDb.update({
      where: { id: userId },
      data: {
        password: await argon2.hash(password),
      },
    });
  }

  async findOne(email: string) {
    const user = await this.emailUsersDb.findUnique({
      where: { email },
      include: {
        userBase: true,
      },
    });
    return user;
  }
}
