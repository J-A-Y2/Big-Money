import {
  ReqExpenseDto,
  ResClassificationExpenseDto,
  ResDetailExpenseDto,
  ResGetExpenseDto,
  UpdateExpenseDto,
} from '../dto/expense.app.dto'
import { Expense } from '../../infra/db/expense.entity'

export interface IExpenseRepository {
  createExpense(expenseData: ReqExpenseDto, budgetId: number): Promise<object>
  updateExpense(updatedData: UpdateExpenseDto): Promise<void>
  getTotalMonthlyExpense(userId: string, date: Date): Promise<object>
  getWeeklyExpense(userId: string, date: Date): Promise<object>
  getAllExpense(userId: string, date: Date): Promise<ResGetExpenseDto[]>
  getExpense(userId: string, expenseId: number): Promise<ResDetailExpenseDto>
  getTotalExpenseByClassification(
    userId: string,
    month: Date,
  ): Promise<ResClassificationExpenseDto[]>
}
