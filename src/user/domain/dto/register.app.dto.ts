import { PickType } from '@nestjs/swagger'

export class ReqRegisterAppDto {
  readonly email: string
  readonly password: string
  readonly name: string
  readonly nickname: string
  readonly birthdate: Date
  readonly age: number
  readonly gender: string
}

export class ReqUpdateUserAppDto extends PickType(ReqRegisterAppDto, [
  'name',
  'nickname',
] as const) {}
