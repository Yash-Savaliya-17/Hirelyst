import {Injectable} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {LoggerService} from '../logger/logger.service';
import {ConfigService} from '@nestjs/config';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailerService {
  private nodeMailer: nodemailer.Transporter;
  constructor(
    private logger: LoggerService,
    private config: ConfigService,
  ) {
    this.nodeMailer = nodemailer.createTransport({
      service: this.config.get('mailer.service'),
      host: this.config.get('mailer.host'),
      port: 587,
      secure: false,
      auth: {
        user: this.config.get('mailer.user'),
        pass: this.config.get('mailer.pass'),
      },
    });
    this.logger.debug('MailerService instantiated');
  }

  async sendMail(options: nodemailer.SendMailOptions) {
    this.logger.debug('Sending mail to ' + options.to);
    await this.nodeMailer.sendMail(options);
    this.logger.debug('Sent mail to ' + options.to);
  }

  async sendVerificationLink(email: string, verificationLink: string) {
    const htmlContent = await this.renderEmailTemplate({link: verificationLink}, 'verify-email');
    await this.sendMail({
      to: email,
      subject: 'Verify your email',
      html: htmlContent,
    });
  }

  async sendResetPasswordLink(email: string, resetPasswordLink: string) {
    const htmlContent = await this.renderEmailTemplate({link: resetPasswordLink, site_name: this.config.get('SITE_NAME')}, 'reset-password');
    await this.sendMail({
      to: email,
      subject: 'Reset your password',
      html: htmlContent
    })
  }

  async sendQuizInvites(emails: string[], title: String, startsAt: Date, endsAt: Date, duration: number, quizLink: string) {
    // Safety check: don't attempt to send if no recipients
    if (!emails || emails.length === 0) {
      this.logger.debug('No recipients to send quiz invites to');
      return;
    }
    
    const htmlContent = await this.renderEmailTemplate({link: quizLink, title, startsAt, endsAt, duration}, 'send-quiz-invites');
    await this.sendMail({
      to: emails.join(","),
      subject: 'You have been invited to a quiz',
      html: htmlContent
    })
  }

  async renderEmailTemplate(data: object, templateName: string): Promise<string> {
    const templatePath = path.join(__dirname, '..', '..', '..', '..', 'src','templates', 'emails', `${templateName}.ejs`);
    const template = await fs.promises.readFile(templatePath, 'utf-8');
    data = {...data, site_name: this.config.get('SITE_NAME')};
    return ejs.render(template, data);
  }

}
