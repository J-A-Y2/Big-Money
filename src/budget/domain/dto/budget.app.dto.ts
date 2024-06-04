import { IsNotEmpty, IsInt, IsObject, IsNumber } from 'class-validator'
import {
  IsClassificationId,
  IsInteger,
} from '@common/decorators/budget.decorator'
import { Transform } from 'class-transformer'
import { Classification } from '@classification/domain/classification.entity'
import { OmitType } from '@nestjs/swagger'

export class ReqBudgetDto {
  readonly userId: string

  @IsNotEmpty({ message: '월 예산은 필수적으로 입력해야 합니다.' })
  readonly month: string

  @IsObject()
  @IsNotEmpty({ message: '각 카테고리별 예산은 필수적으로 입력해야 합니다.' })
  @IsClassificationId({ message: '카테고리 id는 1~18 입니다.' })
  @IsInteger({ message: '각 카테고리별 예산은 정수값이어야 합니다.' })
  readonly amount: Record<number, number>
}

export class ReqRecommendBudgetDto extends OmitType(ReqBudgetDto, ['amount']) {
  @IsNotEmpty({ message: '총액은 필수적으로 입력해야 합니다.' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  readonly total: number
}

export class ReqGetMonthlyBudgetDto extends OmitType(ReqBudgetDto, [
  'amount',
]) {}

export class ResGetMonthlyBudgetDto {
  id: number
  amount: number
  month: string
  created_at: Date
  updated_at: Date
  classification: Classification
}
