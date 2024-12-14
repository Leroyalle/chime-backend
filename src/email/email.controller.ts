import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmailService } from './email.service';
import { Cron } from '@nestjs/schedule';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) { }


  

}
