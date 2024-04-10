import {
  ReqExpenseDto,
  ResClassificationExpenseDto,
  ResDetailExpenseDto,
} from '../dto/expense.app.dto'
import { Expense } from '../../infra/db/expense.entity'
import { UUID } from 'crypto'
import { OAuthFlowObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'

export interface IExpenseRepository {
  createExpense(
    userId: string,
    classificationId: number,
    budgetId: number,
    date: Date,
    amount: number,
    memo: string,
    exception: boolean,
  ): Promise<object>
  getTotalMonthlyExpense(userId: string, date: Date): Promise<object>
  getWeeklyExpense(userId: string, date: Date): Promise<object>
  getAllExpense(userId: string, date: Date): Promise<Expense[]>
  getExpense(userId: string, expenseId: number): Promise<ResDetailExpenseDto>
  getTotalExpenseByClassification(
    userId: string,
    month: Date,
  ): Promise<ResClassificationExpenseDto[]>
}
