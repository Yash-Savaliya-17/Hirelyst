import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  port: parseInt(process.env.DB_PORT) || 5432,
  url: process.env.DATABASE_URL,
}));
