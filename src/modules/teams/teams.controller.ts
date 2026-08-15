import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto, ApplyTeamDto } from './dto/teams.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  async getTeams(@Query('sector') sector?: string) {
    return this.teamsService.findAll(sector);
  }

  @Post()
  async createTeam(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(null, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/apply')
  async applyTeam(@Param('id') id: string, @Req() req: any, @Body() dto: ApplyTeamDto) {
    return this.teamsService.apply(id, req.user.id, dto);
  }
}
