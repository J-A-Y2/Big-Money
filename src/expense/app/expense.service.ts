import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common'
import {
  ReqDetailExpenseDto,
  ReqExpenseDto,
  ReqMonthlyDto,
  ResClassificationExpenseDto,
  ResDetailExpenseDto,
  ResGetExpenseDto,
} from '@expense/domain/dto/expense.app.dto'
import {
  IBUDGET_REPOSITORY,
  IEXPENSE_REPOSITORY,
  IHANDLE_DATE_TIME,
} from '@common/constants/provider.constant'
import { IExpenseService } from '@expense/domain/interface/expense.service.interface'
import { IExpenseRepository } from '@expense/domain/interface/expense.repository.interface'
import { IBudgetRepository } from '@budget/domain/interface/budget.repository.interface'
import { UUID } from 'crypto'
import { IHandleDateTime } from '@common/interfaces/IHandleDateTime'
import { BUDGET_NOTFOUND } from '@common/messages/budget/budget.error'

@Injectable()
export class ExpenseService implements IExpenseService {
  constructor(
    @Inject(IEXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
    @Inject(IBUDGET_REPOSITORY)
    private readonly budgetRepository: IBudgetRepository,
    @Inject(IHANDLE_DATE_TIME)
    private readonly handleDateTime: IHandleDateTime,
  ) {}

  async createExpense(req: ReqExpenseDto): Promise<string> {
    const { year, month } = this.getYearAndMonthFromDate(new Date(req.date))
    const monthDate = new Date(`${year}-${month}-01`)

    const budget = await this.budgetRepository.findBudgetByClassification(
      req.userId,
      req.classificationId,
      monthDate,
    )

    const budgetId = budget[0].id

    if (!budget || Object.keys(budget).length == 0) {
      throw new NotFoundException(BUDGET_NOTFOUND)
    }

    await this.expenseRepository.createExpense(req, budgetId)
    return '지출 설정에 성공하였습니다.'
  }

  async updateExpense(
    id: number,
    userId: string,
    req: ReqExpenseDto,
  ): Promise<void> {
    const expense = await this.expenseRepository.getExpense(userId, id)

    if (!expense || Object.keys(expense).length === 0) {
      throw new NotFoundException('지출 항목을 찾을 수 없습니다.')
    }

    const { year, month } = this.getYearAndMonthFromDate(new Date(req.date))
    const monthDate = new Date(`${year}-${month}-01`)

    const budget = await this.budgetRepository.findBudgetByClassification(
      userId,
      req.classificationId,
      monthDate,
    )

    const budgetId = budget[0].id

    if (!budget || Object.keys(budget).length === 0) {
      throw new NotFoundException(BUDGET_NOTFOUND)
    }
    const updatedExpenseData = {
      ...req,
      budgetId: budgetId,
    }

    await this.expenseRepository.updateExpense({
      ...expense,
      ...updatedExpenseData,
    })
  }

  async getMonthlyExpense(req: ReqMonthlyDto): Promise<object> {
    const yearMonth = new Date(req.month)
    // JavaScript에서 월은 0부터 시작하므로 1을 더합니다.
    const month = yearMonth.getMonth() + 1

    const totalMonthlyExpenseResult =
      await this.expenseRepository.getTotalMonthlyExpense(req.userId, yearMonth)

    const totalWeeklyExpenseResult =
      await this.expenseRepository.getWeeklyExpense(req.userId, yearMonth)

    let result = {}
    // 월간 총 지출을 객체에 추가합니다.
    result[`${month}월 총 지출`] = Number(totalMonthlyExpenseResult['total'])

    //주간 지출을 객체에 추가합니다.
    Object.entries(totalWeeklyExpenseResult).forEach(([key, item], index) => {
      console.log(`item for week ${index + 1}:`, item)
      result[`${month}월 ${index + 1}주`] = Number(item['totalExpense'])
    })

    return result
  }

  async getAllExpense(req: ReqMonthlyDto): Promise<ResGetExpenseDto[]> {
    const yearMonth = new Date(req.month)
    const expenses = await this.expenseRepository.getAllExpense(
      req.userId,
      yearMonth,
    )

    const result = expenses.map((expense) => ({
      id: expense.id,
      date: expense.date,
      amount: expense.amount,
      classification: expense.classification.classification,
    }))

    return result
  }

  async getExpense(
    expenseId: number,
    userId: UUID,
  ): Promise<ResDetailExpenseDto> {
    const result = await this.expenseRepository.getExpense(userId, expenseId)
    return result
  }

  async getTotalExpenseByClassification(
    req: ReqMonthlyDto,
  ): Promise<ResClassificationExpenseDto[]> {
    const month = new Date(req.month)
    const expenses =
      await this.expenseRepository.getTotalExpenseByClassification(
        req.userId,
        month,
      )

    //키를 가지는 객체로 초기화 후 result에 매핑하여 즉시 expense에 할당
    let result: { [key: number]: ResClassificationExpenseDto } = {}
    for (let i = 1; i <= 18; i++) {
      result[i] = { classificationId: i, total: '0' }
    }

    for (let expense of expenses) {
      result[expense.classificationId] = expense
    }

    // result객체를 배열로 변환
    return Object.values(result)
  }

  private getYearAndMonthFromDate(date: Date): { year: number; month: number } {
    const year = this.handleDateTime.getYear(date)
    const month = this.handleDateTime.getMonth(date)
    return { year, month }
  }
}
