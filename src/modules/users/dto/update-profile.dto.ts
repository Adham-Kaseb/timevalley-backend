import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'الاسم يجب أن يكون نصاً' })
  @MinLength(2, { message: 'الاسم يجب أن لا يقل عن حرفين' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'النبذة يجب أن تكون نصاً' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'المسار التعليمي يجب أن يكون نصاً' })
  track?: string;

  @IsOptional()
  @IsString({ message: 'رابط الصورة يجب أن يكون نصاً' })
  avatar?: string;
}
