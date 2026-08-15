export class SaveVentureIdeaDto {
  title: string;
  sector: string;
  icpTarget: string;
  problemStatement: string;
  tamEstimate: string;
  pitchScore?: number;
}

export class SaveMarketCalculationDto {
  title: string;
  tamAmount: string;
  samAmount: string;
  somAmount: string;
  defensibilityScore?: number;
}
