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
    const existingBudget = await this.budgetRepository.findSameBudget(
      new Date(req.month),
      req.userId,
    )
    if (Object.keys(existingBudget).length > 0) {
      throw new ConflictException(BUDGET_ALREADY_EXIST)
    }

    await this.processBudget(req, 'createBudget')
    return '예산 설정에 성공하였습니다.'
  }

  async updateBudget(req: ReqBudgetDto): Promise<string> {
    await this.processBudget(req, 'updateBudget')
    return '예산 변경에 성공하였습니다.'
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

  private async processBudget(
    req: ReqBudgetDto,
    message: string,
  ): Promise<void> {
    const yearMonth = new Date(req.month)
    await Promise.all(
      Object.entries(req.amount).map(async ([classification, budget]) => {
        await this.budgetRepository[message](
          req.userId,
          yearMonth,
          Number(classification),
          budget,
        )
      }),
    )
  }
}
