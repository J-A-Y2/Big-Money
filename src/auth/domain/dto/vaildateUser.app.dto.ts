export class ReqValidateUserAppDto {
  readonly email: string
  readonly password: string
}

export class ResValidateUserAppDto {
  readonly id: string
  readonly email: string
  readonly createdAt: Date
}
