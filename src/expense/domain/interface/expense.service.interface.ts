import { UUID } from 'crypto'
import {
  ReqDetailExpenseDto,
  ReqExpenseDto,
  ReqMonthlyDto,
  ResClassificationExpenseDto,
  ResDetailExpenseDto,
  ResGetExpenseDto,
} from '../dto/expense.app.dto'

export interface IExpenseService {
  createExpense(req: ReqExpenseDto): Promise<string>
  getMonthlyExpense(req: ReqMonthlyDto): Promise<object>
  getAllExpense(req: ReqMonthlyDto): Promise<ResGetExpenseDto[]>
  getExpense(expenseId: number, userId: string): Promise<ResDetailExpenseDto>
  getTotalExpenseByClassification(
    req: ReqMonthlyDto,
  ): Promise<ResClassificationExpenseDto[]>
  updateExpense(
    expenseId: number,
    userId: string,
    expenseData: ReqExpenseDto,
  ): Promise<void>
}
