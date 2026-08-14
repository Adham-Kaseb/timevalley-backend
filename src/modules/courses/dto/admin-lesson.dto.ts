import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @IsInt()
  lessonNumber: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  desc: string;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  materials?: any;

  @IsOptional()
  @IsInt()
  orderIndex?: number;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  materials?: any;

  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @IsOptional()
  @IsInt()
  lessonNumber?: number;
}
