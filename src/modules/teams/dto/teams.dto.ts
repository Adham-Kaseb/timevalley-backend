export class CreateTeamDto {
  name: string;
  sector: string;
  founderName: string;
  description: string;
  openRoles: string[];
  equitySplit: string;
}

export class ApplyTeamDto {
  appliedRole: string;
  coverNote?: string;
}
