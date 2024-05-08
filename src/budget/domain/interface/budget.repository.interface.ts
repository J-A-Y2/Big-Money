import { Budget } from '../budget.entity'
import { ResGetMonthlyBudgetDto } from '../dto/budget.app.dto'

export interface IBudgetRepository {
  createBudget(
    userId: string,
    month: Date,
    classification: number,
    amount: number,
  ): Promise<Budget>
  // findBudget(month: Date, userId: string): Promise<object>
  findBudgetByClassification(
    userId: string,
    classificationId: number,
    month: Date,
  ): Promise<object>
  findMonthlyBudget(
    userId: string,
    month: Date,
  ): Promise<ResGetMonthlyBudgetDto[]>
  // findTotalBudget(userId: string, month: Date)
  updateBudget(
    userId: string,
    month: Date,
    classification: number,
    amount: number,
  ): Promise<void>
  getMonthlyBudgetRatio(month: Date, userId: string): Promise<object>
}
