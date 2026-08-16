import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyResetCodeDto {
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  @IsString({ message: 'كود التحقق يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'كود التحقق مطلوب' })
  @Length(6, 6, { message: 'كود التحقق يتكون من 6 أرقام' })
  code: string;
}
