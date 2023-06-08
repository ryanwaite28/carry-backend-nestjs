import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import {
  USERNAME_REGEX,
  NAME_REGEX,
  PASSWORD_REGEX
} from '../regex/user.regex';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @Matches(NAME_REGEX)
  @IsNotEmpty()
  firstname: string;

  @ApiProperty()
  @IsString()
  @Matches(NAME_REGEX)
  @IsNotEmpty()
  lastname: string;

  @ApiProperty()
  @IsString()
  @Matches(USERNAME_REGEX)
  @IsOptional()
  username: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_REGEX)
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_REGEX)
  @IsNotEmpty()
  confirmPassword: string;
}


export class LoginUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email_or_username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}


export class ResetPasswordRequestDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class SendUserMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;
}


export class UpdateUserDto {  
  @ApiProperty()
  @IsOptional()
  @Matches(/[a-zA-Z0-9\-\_\.]{2,50}/)
  username: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  displayname?: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  headline?: string;
}


export class UserPasswordUpdateDto {
  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_REGEX)
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_REGEX)
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_REGEX)
  @IsNotEmpty()
  confirmPassword: string;
}


export class CreateSiteFeedbackDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsIn([1, 2, 3, 4, 5])
  rating: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  summary?: string;
}

export class CreateUserNewListingsAlertDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty()
  @ValidateIf((obj) => !obj.from_city && !obj.fron_state)
  @IsString()
  @IsNotEmpty()
  to_city: string;
  
  @ApiProperty()
  @ValidateIf((obj) => !obj.from_city && !obj.fron_state)
  @IsString()
  @IsNotEmpty()
  to_state: string;
  
  @ApiProperty()
  @ValidateIf((obj) => !obj.to_city && !obj.to_state)
  @IsString()
  @IsNotEmpty()
  from_city: string;
  
  @ApiProperty()
  @ValidateIf((obj) => !obj.to_city && !obj.to_state)
  @IsString()
  @IsNotEmpty()
  from_state: string;
}

export class RedirectBodyDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  redirectUrl?: string;
}

export class RegisterExpoTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  expo_token: string;
}

export class UserSubscriptionInfoDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  current_period_start: number;

  @ApiProperty()
  current_period_end: number;
}