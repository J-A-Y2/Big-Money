import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import {
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
    const budgetId = await this.getBudgetIdFromRequest(req, req.userId)
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

    const budgetId = await this.getBudgetIdFromRequest(req, userId)
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
    const month = yearMonth.getMonth() + 1

    const totalMonthlyExpenseResult =
      await this.expenseRepository.getTotalMonthlyExpense(req.userId, yearMonth)

    const totalWeeklyExpenseResult =
      await this.expenseRepository.getWeeklyExpense(req.userId, yearMonth)

    return this.createExpenseResult(
      month,
      totalMonthlyExpenseResult,
      totalWeeklyExpenseResult,
    )
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

    // 지출 항목을 분류별로 총 지출을 계산하는 함수 호출하여 반환
    return this.calculateTotalExpenseByClassification(expenses)
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
    userId: string,
  ): Promise<ResDetailExpenseDto> {
    const result = await this.expenseRepository.getExpense(userId, expenseId)
    return result
  }

  async getBudgetIdFromRequest(
    req: ReqExpenseDto,
    userId: string,
  ): Promise<number> {
    const { year, month } = this.getYearAndMonthFromDate(new Date(req.date))
    const monthDate = new Date(`${year}-${month}-01`)

    const budget = await this.budgetRepository.findBudgetByClassification(
      userId,
      req.classificationId,
      monthDate,
    )

    if (!budget || Object.keys(budget).length === 0) {
      throw new NotFoundException(BUDGET_NOTFOUND)
    }

    return budget[0].id
  }

  private calculateTotalExpenseByClassification(
    expenses: ResClassificationExpenseDto[],
  ): ResClassificationExpenseDto[] {
    // 키를 가지는 객체로 초기화 후 result에 매핑하여 즉시 expense에 할당
    let result: { [key: number]: ResClassificationExpenseDto } = {}
    for (let i = 1; i <= 18; i++) {
      result[i] = { classificationId: i, total: '0' }
    }

    for (let expense of expenses) {
      result[expense.classificationId] = expense
    }

    // result 객체를 배열로 변환하여 반환
    return Object.values(result)
  }

  private getYearAndMonthFromDate(date: Date): { year: number; month: number } {
    const year = this.handleDateTime.getYear(date)
    const month = this.handleDateTime.getMonth(date)
    return { year, month }
  }

  private createExpenseResult(
    month: number,
    totalMonthlyExpenseResult: any,
    totalWeeklyExpenseResult: Record<string, any>,
  ): Record<string, number> {
    let result: Record<string, number> = {}

    // 월간 총 지출을 객체에 추가합니다.
    result[`${month}월 총 지출`] = totalMonthlyExpenseResult
      ? Number(totalMonthlyExpenseResult['total'])
      : 0

    // 주간 지출을 객체에 추가합니다.
    Object.entries(totalWeeklyExpenseResult).forEach(([key, item], index) => {
      result[`${month}월 ${index + 1}주`] = item.totalExpense
        ? Number(item.totalExpense)
        : 0
    })

    return result
  }
}
