import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateContactDto {
  @IsString({ message: 'الاسم يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الاسم مطلوب' })
  name: string;

  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'الموضوع يجب أن يكون نصاً' })
  subject?: string;

  @IsString({ message: 'الرسالة يجب أن تكون نصاً' })
  @IsNotEmpty({ message: 'الرسالة مطلوبة' })
  @MinLength(5, { message: 'الرسالة يجب أن لا تقل عن 5 أحرف' })
  message: string;
}
