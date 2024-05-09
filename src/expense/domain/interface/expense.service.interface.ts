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
  getExpense(id: number, userId: string): Promise<ResDetailExpenseDto>
  getTotalExpenseByClassification(
    req: ReqMonthlyDto,
  ): Promise<ResClassificationExpenseDto[]>
  updateExpense(
    id: number,
    userId: string,
    expense: ReqExpenseDto,
  ): Promise<void>
}
