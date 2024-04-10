import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsString,
  IsBoolean,
  IsIn,
  IsOptional,
} from 'class-validator'
import { Type } from 'class-transformer'
import { UUID } from 'crypto'

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

export class ReqMonthlyDto {
  readonly userId: string
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
export class ResDetailExpenseDto {
  id: number
  date: Date
  amount: number
  memo: string
}

export class ReqClassificationExpenseDto {
  userId: string
}

export class ResClassificationExpenseDto {
  classificationId: number
  total: string
}
