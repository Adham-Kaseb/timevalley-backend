import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'رمز إعادة التعيين يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رمز إعادة التعيين مطلوب' })
  token: string;

  @IsString({ message: 'كلمة المرور الجديدة يجب أن تكون نصاً' })
  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  @MinLength(8, { message: 'كلمة المرور يجب أن لا تقل عن 8 أحرف' })
  newPassword: string;
}
