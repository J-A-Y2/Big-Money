import {
  ReqBudgetDto,
  ReqGetMonthlyBudgetDto,
  ReqRecommendBudgetDto,
  ResGetMonthlyBudgetDto,
} from '../dto/budget.app.dto'

export interface IBudgetService {
  createBudget(req: ReqBudgetDto): Promise<string>
  updateBudget(req: ReqBudgetDto): Promise<string>
  recommendBudget(req: ReqRecommendBudgetDto): Promise<object>
  monthlyBudget(req: ReqGetMonthlyBudgetDto): Promise<ResGetMonthlyBudgetDto[]>
}
