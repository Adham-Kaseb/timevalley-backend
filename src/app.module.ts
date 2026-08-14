import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ContactModule } from './modules/contact/contact.module';

import { SocketModule } from './modules/socket/socket.module';

@Module({
  imports: [PrismaModule, RedisModule, SocketModule, AuthModule, UsersModule, CoursesModule, PaymentsModule, ContactModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

