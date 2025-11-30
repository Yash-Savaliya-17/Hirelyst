import { registerAs } from '@nestjs/config';

export default registerAs('mailer', () => ({
  host: process.env.MAILER_HOST,
  service: process.env.MAILER_SERVICE,
  user: process.env.MAILER_MAIL,
  pass: process.env.MAILER_SECRET,
  name: process.env.MAILER_NAME,
}));
