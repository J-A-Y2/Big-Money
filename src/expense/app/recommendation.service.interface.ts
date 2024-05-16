import { ReqMonthlyDto } from '@expense/domain/dto/expense.app.dto'

export interface IRecommendationService {
  recommendExpenditure(req: ReqMonthlyDto): Promise<object>
  todayUsage(req: ReqMonthlyDto): Promise<object>
}
