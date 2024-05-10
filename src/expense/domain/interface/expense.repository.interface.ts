import {
  ReqExpenseDto,
  ResClassificationExpenseDto,
  ResDetailExpenseDto,
  UpdateExpenseDto,
} from '../dto/expense.app.dto'
import { Expense } from '../../infra/db/expense.entity'

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
  updateExpense(updatedData: UpdateExpenseDto): Promise<void>
  getTotalMonthlyExpense(userId: string, date: Date): Promise<object>
  getWeeklyExpense(userId: string, date: Date): Promise<object>
  getAllExpense(userId: string, date: Date): Promise<Expense[]>
  getExpense(userId: string, expenseId: number): Promise<ResDetailExpenseDto>
  getTotalExpenseByClassification(
    userId: string,
    month: Date,
  ): Promise<ResClassificationExpenseDto[]>
}
