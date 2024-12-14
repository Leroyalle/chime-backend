import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';



@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }





}
