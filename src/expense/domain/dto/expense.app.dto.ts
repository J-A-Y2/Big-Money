import { OmitType, PickType } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsString,
  IsBoolean,
} from 'class-validator'

export class ReqExpenseDto {
  readonly userId: string

  @IsNotEmpty({ message: '지출 금액은 필수적으로 입력해야 합니다.' })
  @IsNumber()
  amount: number

  @IsNotEmpty({ message: '지출 일자는 필수적으로 입력해야 합니다.' })
  @IsDateString()
  date: string

  @IsString()
  memo?: string

  @IsBoolean()
  exception: boolean

  @IsNotEmpty({ message: '카테고리의 id는 필수적으로 입력해야 합니다.' })
  classificationId: number
}
export class UpdateExpenseDto extends ReqExpenseDto {
  @IsNumber()
  id: number

  @IsNumber()
  budgetId: number
}

export class ReqMonthlyDto extends PickType(ReqExpenseDto, [
  'userId',
] as const) {
  @IsNotEmpty({ message: '지출 월은 필수적으로 입력해야 합니다.' })
  readonly month: string
}

export class ResGetExpenseDto {
  id: number
  date: Date
  amount: number
  classification: string
}
export class ReqDetailExpenseDto {
  userId: string
  id: number
}
export class ResDetailExpenseDto extends OmitType(ResGetExpenseDto, [
  'classification',
] as const) {
  memo: string
}

export class ReqClassificationExpenseDto extends OmitType(ReqDetailExpenseDto, [
  'id',
]) {}

export class ResClassificationExpenseDto extends PickType(ReqExpenseDto, [
  'classificationId',
]) {
  total: string
}
