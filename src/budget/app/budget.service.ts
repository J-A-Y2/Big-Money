import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common'
import {
  ReqBudgetDto,
  ReqRecommendBudgetDto,
} from '@budget/domain/dto/budget.app.dto'
import { IBudgetService } from '@budget/domain/interface/budget.service.interface'
import { IBUDGET_REPOSITORY } from '@common/constants/provider.constant'
import { IBudgetRepository } from '@budget/domain/interface/budget.repository.interface'
import {
  calculateBudget,
  calculateRecommendedBudget,
} from '@common/utils/budgetRecommend'
import {
  BUDGET_ALREADY_EXIST,
  BUDGET_NOTFOUND,
} from '@common/messages/budget/budget.error'

@Injectable()
export class BudgetService implements IBudgetService {
  constructor(
    @Inject(IBUDGET_REPOSITORY)
    private readonly budgetRepository: IBudgetRepository,
  ) {}

  async createBudget(req: ReqBudgetDto): Promise<string> {
    try {
      const yearMonth = new Date(req.month) // month는 문자열
      const existingBudget = await this.budgetRepository.findSameBudget(
        yearMonth,
        req.userId,
      )
      // 해당 달에 이미 예산이 있는지 확인
      if (Object.keys(existingBudget).length > 0) {
        throw new ConflictException(BUDGET_ALREADY_EXIST)
      } else {
        await Promise.all(
          Object.entries(req.amount).map(async ([classification, budget]) => {
            await this.budgetRepository.createBudget(
              req.userId,
              yearMonth,
              Number(classification),
              budget,
            )
          }),
        )
        return '예산 설정에 성공하였습니다.'
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      } else {
        throw new InternalServerErrorException('예산 설정에 실패했습니다.')
      }
    }
  }

  async updateBudget(req: ReqBudgetDto): Promise<string> {
    try {
      const yearMonth = new Date(req.month)
      const existingBudget = await this.budgetRepository.findSameBudget(
        yearMonth,
        req.userId,
      )
      // 해당 달에 이미 예산이 있는지 확인
      if (Object.keys(existingBudget).length > 0) {
        await Promise.all(
          Object.entries(req.amount).map(async ([classification, budget]) => {
            await this.budgetRepository.updateBudget(
              req.userId,
              yearMonth,
              Number(classification),
              budget,
            )
          }),
        )
        return '예산 변경에 성공하였습니다.'
      } else {
        throw new NotFoundException(BUDGET_NOTFOUND)
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      } else {
        throw new InternalServerErrorException('예산 변경에 실패했습니다.')
      }
    }
  }

  async recommendBudget(req: ReqRecommendBudgetDto): Promise<object> {
    const yearMonth = new Date(req.month)
    const findBudgetRatio = await this.budgetRepository.getMonthlyBudgetRatio(
      yearMonth,
      req.userId,
    )

    const totalBudget = Number(req.total)

    const recommendedBudget = calculateRecommendedBudget(
      findBudgetRatio,
      (ratio: number) => calculateBudget(totalBudget, ratio),
    )

    return {
      message: '정상적으로 추천 예산이 생성되었습니다.',
      recommendedBudget,
    }
  }
}
