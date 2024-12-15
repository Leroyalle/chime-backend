import { Injectable, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { DatabaseService } from 'src/database/database.service';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private databaseService: DatabaseService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      secret: false,
      auth: {
        user: 'vashilo.artem7@gmail.com',//почта с которой идет отправка
        pass: 'haxk tuyb wxrs usmj',//ключ который берется из google auth
      },
    });
  }

  async sendVerificationCode(email: string, code: string) {
    const mailOptions = {
      from: 'Email Verification Code',
      to: email,
      subject: 'Email Verification Code',
      text: `Your verification code is: ${code}`,
    };

    console.log(mailOptions);

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
    } catch (error) {
      console.error('Error sending email:', error);
    }

  }


  async createVerificationCode(userId: string, code: string) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    return await this.databaseService.verificationCode.create({
      data: {
        code,
        expiresAt,
        userId,
      },
    });
  }

  async verifyCode(userId: string, code: string): Promise<boolean> {
    const verificationCode = await this.databaseService.verificationCode.findFirst({
      where: {
        userId,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (verificationCode) {
      await this.databaseService.verificationCode.delete({
        where: { id: verificationCode.id },
      })

      return true
    }
    return false
  }








  async sendReportOnEmail(email: string, filePath: string) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: 'your-email@example.com',
      to: email,
      subject: 'Daily Report',
      text: 'Here is the daily report.',
      attachments: [
        {
          filename: 'report.pdf',
          path: filePath,
        },
      ],
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Report sent to ${email}`);
    } catch (error) {
      console.error(`Error sending report to ${email}:`, error);
    }
  }

}