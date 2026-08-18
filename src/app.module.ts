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
import { TeamsModule } from './modules/teams/teams.module';
import { EventsModule } from './modules/events/events.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { IdeationModule } from './modules/ideation/ideation.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CertificatesModule } from './modules/certificates/certificates.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    SocketModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    PaymentsModule,
    ContactModule,
    TeamsModule,
    EventsModule,
    ResourcesModule,
    IdeationModule,
    CouponsModule,
    ConsultationsModule,
    NotificationsModule,
    CertificatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
