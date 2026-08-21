import { Module } from '@nestjs/common';
import { BunnyService } from './bunny.service';
import { BunnyController } from './bunny.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BunnyController],
  providers: [BunnyService],
  exports: [BunnyService],
})
export class BunnyModule {}
