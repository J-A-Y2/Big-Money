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
    try {
      const {
        classificationId,
        userId,
        amount,
        memo,
        exception,
        date: reqDate,
      } = req

      const date = new Date(reqDate)
      const year = this.handleDateTime.getYear(date)
      const month = this.handleDateTime.getMonth(date)

      const monthDate = this.handleDateTime.getMonthDate(year, month)
      const monthDateZoned =
        this.handleDateTime.convertZonedDateTimeToDate(monthDate)

      const budget = await this.budgetRepository.findBudgetByClassification(
        userId,
        classificationId,
        monthDateZoned,
      )

      if (!budget || Object.keys(budget).length === 0) {
        console.log('예산을 찾을 수 없습니다.')
        return
      }

      const budgetId = budget[0].id

      await this.expenseRepository.createExpense(
        userId,
        classificationId,
        budgetId,
        date,
        amount,
        memo,
        exception,
      )
      return '지출 설정에 성공하였습니다.'
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      } else {
        throw new InternalServerErrorException('지출 설정에 실패했습니다.')
      }
    }
  }

  async getMonthlyExpense(req: ReqMonthlyDto): Promise<object> {
    try {
      const yearMonthZoned = this.handleDateTime.getYearMonth(req.month)
      const yearMonth =
        this.handleDateTime.convertZonedDateTimeToDate(yearMonthZoned)

      const month = yearMonth.getMonth() + 1 // JavaScript에서 월은 0부터 시작하므로 1을 더해주어야 합니다.

      const totalMonthlyExpenseResult =
        await this.expenseRepository.getTotalMonthlyExpense(
          req.userId,
          yearMonth,
        )

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
    } catch (error) {
      throw new InternalServerErrorException(
        '한달 지출 금액 불러오기에 실패했습니다.',
      )
    }
  }

  async getAllExpense(req: ReqMonthlyDto): Promise<ResGetExpenseDto[]> {
    try {
      const yearMonth = new Date(req.month)
      const expenses = await this.expenseRepository.getAllExpense(
        req.userId,
        yearMonth,
      )
      console.log('expenses', expenses)
      const result = expenses.map((expense) => ({
        id: expense.id,
        date: expense.date,
        amount: expense.amount,
        classification: expense.classification.classification,
      }))

      return result
    } catch (error) {
      throw new InternalServerErrorException(
        '한달 모든 지출 불러오기에 실패했습니다.',
      )
    }
  }

  async getExpense(id: number, userId: UUID): Promise<ResDetailExpenseDto> {
    try {
      const result = await this.expenseRepository.getExpense(userId, id)
      return result
    } catch (error) {
      throw new InternalServerErrorException(
        '상세지출 내역 가져오기에 실패했습니다.',
      )
    }
  }

  async getTotalExpenseByClassification(
    req: ReqMonthlyDto,
  ): Promise<ResClassificationExpenseDto[]> {
    try {
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
    } catch (error) {
      throw new InternalServerErrorException(
        '카테고리지출 내역 가져오기에 실패했습니다.',
      )
    }
  }
}
