import {
  IsDateString,
  IsEmail,
  IsInt,
  IsString,
  Matches,
} from 'class-validator'
import {
  VALIDATE_EMAIL,
  VALIDATE_PASSWORD,
} from '@common/messages/auth/auth.messages'
import { Transform } from 'class-transformer'
import {
  USER_EMAIL,
  USER_EMAIL_EXAMPLE,
  USER_PWD,
  USER_PWD_EXAMPLE,
} from '@common/constants/user.constant'
import { USER_ALREADY_EXIST } from '@common/messages/user/user.errors'
import { ApiProperty } from '@nestjs/swagger'

export class ReqRegisterDto {
  @ApiProperty()
  @IsEmail({}, { message: VALIDATE_EMAIL })
  @Transform(({ value }) => value.toLowerCase())
  readonly email: string

  @ApiProperty()
  @IsString()
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,20}$/, {
    message: VALIDATE_PASSWORD,
  })
  readonly password: string

  @ApiProperty()
  @IsString()
  readonly name: string

  @ApiProperty()
  @IsString()
  readonly nickname: string

  @ApiProperty()
  @IsDateString()
  readonly birthdate: Date

  @ApiProperty()
  @IsInt()
  readonly age: number

  @ApiProperty()
  @IsString()
  readonly gender: string
}
export class ReqUpdateDto {
  readonly userId: string

  @ApiProperty()
  @IsString()
  readonly name: string

  @ApiProperty()
  @IsString()
  readonly nickname: string
}
