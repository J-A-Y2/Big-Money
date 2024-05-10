import { Injectable } from '@nestjs/common'
import { Expense } from '@expense/infra/db/expense.entity'
import { IExpenseRepository } from '@expense/domain/interface/expense.repository.interface'
import { plainToClass, plainToInstance } from 'class-transformer'
import { Repository, DeepPartial, QueryFailedError } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { UUID } from 'crypto'
import {
  ReqExpenseDto,
  ResClassificationExpenseDto,
  ResDetailExpenseDto,
  ResGetExpenseDto,
  UpdateExpenseDto,
} from '@expense/domain/dto/expense.app.dto'

@Injectable()
export class ExpenseRepository implements IExpenseRepository {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async createExpense(
    userId: UUID,
    classificationId: number,
    budgetId: number,
    date: Date,
    amount: number,
    memo: string,
    exception: boolean,
  ): Promise<object> {
    // console.log(budgetId)
    try {
      const result = await this.expenseRepository.save({
        user: { id: userId },
        classification: { id: classificationId },
        budget: { id: budgetId },
        date,
        amount,
        memo,
        exception,
      })
      console.log(result)
      return result
    } catch (error) {
      if (error instanceof QueryFailedError) {
        console.log('실행된 쿼리:', error.query) // 실패한 쿼리를 출력합니다.
        console.log('사용된 매개변수:', error.parameters) // 쿼리에 사용된 매개변수를 출력합니다.
      }
      console.error('Expense 생성 중 오류가 발생했습니다:', error)
      throw error
    }
  }

  async updateExpense(updatedData: UpdateExpenseDto): Promise<void> {
    await this.expenseRepository.save({
      classification: { id: updatedData.classificationId },
      budget: { id: updatedData.budgetId },
      ...updatedData,
    })
  }

  async getTotalMonthlyExpense(userId: UUID, date: Date): Promise<object> {
    const startDate = date // 입력된 날짜의 월의 시작일 (예: 2023-11-01)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0) // 입력된 날짜의 월의 마지막일 (예: 2023-11-30)

    const totalExpense = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total')
      .where('expense.user = :userId', { userId })
      .andWhere('expense.date >= :startDate', { startDate })
      .andWhere('expense.date <= :endDate', { endDate })
      .getRawOne()

    return totalExpense // { total: "<월간 총 지출액>" }
  }
  async getWeeklyExpense(userId: UUID, date: Date): Promise<object[]> {
    const startDate = date
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const weeks = [
      {
        start: new Date(startDate),
        end: new Date(startDate.getFullYear(), startDate.getMonth(), 7),
      },
      {
        start: new Date(startDate.getFullYear(), startDate.getMonth(), 8),
        end: new Date(startDate.getFullYear(), startDate.getMonth(), 14),
      },
      {
        start: new Date(startDate.getFullYear(), startDate.getMonth(), 15),
        end: new Date(startDate.getFullYear(), startDate.getMonth(), 21),
      },
      {
        start: new Date(startDate.getFullYear(), startDate.getMonth(), 22),
        end: new Date(endDate),
      },
    ]

    const weeklyExpenses = []

    for (const week of weeks) {
      const weeklyExpense = await this.expenseRepository
        .createQueryBuilder('expense')
        .select('SUM(expense.amount)', 'total')
        .where('expense.user = :userId', { userId })
        .andWhere('expense.date >= :startDate', { startDate: week.start })
        .andWhere('expense.date <= :endDate', { endDate: week.end })
        .getRawOne()

      weeklyExpenses.push({
        weekStart: week.start.toISOString().split('T')[0],
        weekEnd: week.end.toISOString().split('T')[0],
        totalExpense: weeklyExpense.total,
      })
    }

    return weeklyExpenses
  }

  async getAllExpense(userId: UUID, date: Date): Promise<Expense[]> {
    try {
      const formattedDate = date.toISOString().slice(0, 7) // YYYY-MM format
      const getAllExpense = await this.expenseRepository
        .createQueryBuilder('expense')
        .leftJoinAndSelect('expense.classification', 'classification')
        .where("TO_CHAR(expense.date, 'YYYY-MM') = :formattedDate", {
          formattedDate,
        })
        .andWhere('expense.user.id = :userId', { userId })
        .getMany()

      const expenses: Expense[] = plainToInstance(Expense, getAllExpense)

      return expenses
    } catch (error) {
      // error handling
    }
  }

  async getExpense(
    userId: UUID,
    expenseId: number,
  ): Promise<ResDetailExpenseDto> {
    const result = await this.expenseRepository.findOne({
      where: { id: expenseId, user: { id: userId } },
    })
    const expense: Expense = plainToInstance(Expense, result)
    return expense
  }

  async getTotalExpenseByClassification(
    userId: UUID,
    month: Date,
  ): Promise<ResClassificationExpenseDto[]> {
    try {
      const monthStr = month.toISOString().split('T')[0]
      const expenses = await this.expenseRepository
        .createQueryBuilder('expense')
        .select('expense.classification_id', 'classificationId')
        .addSelect('SUM(expense.amount)', 'total')
        .where('expense.user_id = :userId', { userId })
        .andWhere('expense.exception = false')
        .andWhere(
          `DATE_TRUNC('month', expense.date) = DATE_TRUNC('month', TO_DATE(:monthStr, 'YYYY-MM-DD'))`,
          { monthStr },
        )
        .groupBy('expense.classification_id')
        .getRawMany()

      // console.log(expenses)
      return expenses
    } catch (error) {
      console.error(
        'Error while getting total expense by classification:',
        error,
      )
      throw error
    }
  }
}
