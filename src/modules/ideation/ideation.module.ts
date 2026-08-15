import { Module } from '@nestjs/common';
import { IdeationController } from './ideation.controller';
import { IdeationService } from './ideation.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IdeationController],
  providers: [IdeationService],
  exports: [IdeationService],
})
export class IdeationModule {}
