import { Injectable, Inject, ConflictException } from '@nestjs/common'
import {
  IBUDGET_REPOSITORY,
  IEXPENSE_REPOSITORY,
  IEXPENSE_SERVICE,
  IHANDLE_DATE_TIME,
} from '@common/constants/provider.constant'
import { IExpenseRepository } from '@expense/domain/interface/expense.repository.interface'
import { IBudgetRepository } from '@budget/domain/interface/budget.repository.interface'
import { IRecommendationService } from '@expense/app/recommendation.service.interface'
import {
  ReqMonthlyDto,
  ResClassificationExpenseDto,
} from '@expense/domain/dto/expense.app.dto'
import { IExpenseService } from '@expense/domain/interface/expense.service.interface'
import { Cron, CronExpression } from '@nestjs/schedule'
import { HttpService } from '@nestjs/axios'
import { payloads } from './webhook.payloads'
import { IHandleDateTime } from '@common/interfaces/IHandleDateTime'
import { ResGetMonthlyBudgetDto } from '@budget/domain/dto/budget.app.dto'

@Injectable()
export class RecommendationService implements IRecommendationService {
  constructor(
    private httpService: HttpService,
    @Inject(IEXPENSE_SERVICE)
    private readonly expenseService: IExpenseService,
    @Inject(IEXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
    @Inject(IBUDGET_REPOSITORY)
    private readonly budgetRepository: IBudgetRepository,
    @Inject(IHANDLE_DATE_TIME)
    private readonly handleDateTime: IHandleDateTime,
  ) {}
  amountForm = (amount: number): string => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  calculateDailyRecommendedExpenditure(
    budget: ResGetMonthlyBudgetDto[],
    expense: ResClassificationExpenseDto[],
  ) {
    const today = this.handleDateTime.getToday()
    const endOfMonth = this.handleDateTime.getEndOfMonth(new Date(today))
    const remainingDays = this.handleDateTime.getRemainingDays(
      new Date(today),
      endOfMonth,
    )

    // Budget과 Expense를 classificationId를 기준으로 하나의 객체에 합칩니다.
    const budgetExpenseMap = new Map()
    for (const b of budget) {
      budgetExpenseMap.set(b.classification.id, {
        budget: b.amount,
        expense: 0,
        classification: b.classification.classification,
      })
    }
    for (const e of expense) {
      if (budgetExpenseMap.has(e.classificationId)) {
        const be = budgetExpenseMap.get(e.classificationId)
        be.expense = Number(e.total)
      }
    }

    // 일일 추천 지출액을 계산합니다.
    const dailyRecommendedExpenditure = []
    for (const [
      classificationId,
      { budget, expense, classification },
    ] of budgetExpenseMap) {
      const remainingBudget = budget - expense
      let dailyBudget
      if (remainingBudget > 0) {
        dailyBudget = Math.round(remainingBudget / remainingDays)
      } else {
        dailyBudget = 0 // 예산 초과 시 일일 권장 지출액을 0으로 설정
      }
      dailyRecommendedExpenditure.push({
        classificationId,
        classification,
        dailyBudget,
      }) // classificationId를 추가
    }
    dailyRecommendedExpenditure.sort((a, b) =>
      a.classification > b.classification ? 1 : -1,
    )
    return dailyRecommendedExpenditure
  }

  calculateUsageStatus(
    dailyRecommendedExpenditure: any[],
    expense: ResClassificationExpenseDto[],
  ) {
    // console.log(dailyRecommendedExpenditure)
    const statusMap = new Map()
    for (const {
      classificationId,
      classification,
      dailyBudget,
    } of dailyRecommendedExpenditure) {
      const expenseItem = expense.find(
        (e) => e.classificationId === classificationId,
      )
      const totalExpense = expenseItem ? Number(expenseItem.total) : 0
      let usagePercentage
      if (dailyBudget === 0) {
        usagePercentage = totalExpense > 0 ? 101 : 0
      } else {
        usagePercentage = Math.round((totalExpense / dailyBudget) * 100) // Math.round()를 사용하여 반올림
      }

      let status
      if (usagePercentage <= 30) {
        status = 'Awesome'
      } else if (usagePercentage <= 50) {
        status = 'Good'
      } else if (usagePercentage <= 100) {
        status = 'So So'
      } else {
        status = 'Bad'
      }

      statusMap.set(classification, { usagePercentage, status })
    }

    return statusMap
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM, { name: 'recommendExpenditureTask' })
  async recommendExpenditure(req: ReqMonthlyDto): Promise<object> {
    try {
      const firstDayOfMonthZoned = this.handleDateTime.getYearMonth(req.month)

      const firstDayOfMonth =
        this.handleDateTime.convertZonedDateTimeToDate(firstDayOfMonthZoned)

      const webUrl = process.env.DISCORD_WEBHOOK_URL

      const budget = await this.budgetRepository.findMonthlyBudget(
        req.userId,
        firstDayOfMonth,
      )

      const expense = await this.expenseService.getTotalExpenseByClassification(
        { userId: req.userId, month: req.month },
      )

      const dailyRecommendedExpenditure =
        this.calculateDailyRecommendedExpenditure(budget, expense)

      const payload = [
        {
          name: '오늘의 지출 추천',
          value: '',
          inline: true,
        },
      ]

      for (const key in dailyRecommendedExpenditure) {
        const item = dailyRecommendedExpenditure[key]
        payload[0].value += `${item.classification} : ${this.amountForm(
          item.dailyBudget,
        )}₩
        `
      }

      const message = payloads.MORNING_CONSULTING(payload)

      this.sendDiscord(webUrl, message)
      return dailyRecommendedExpenditure
    } catch (error) {
      throw new ConflictException('오늘의 지출 추천 불러오기에 실패 했습니다.')
    }
  }

  //오후 9시 스케쥴링
  @Cron('0 21 * * *', { name: 'recommendExpenditureTask' })
  async todayUsage(req: ReqMonthlyDto): Promise<object> {
    try {
      const firstDayOfMonthZoned = this.handleDateTime.getYearMonth(req.month)

      const firstDayOfMonth =
        this.handleDateTime.convertZonedDateTimeToDate(firstDayOfMonthZoned)

      const webUrl = process.env.DISCORD_WEBHOOK_URL

      const budget = await this.budgetRepository.findMonthlyBudget(
        req.userId,
        firstDayOfMonth,
      )

      const expense = await this.expenseService.getTotalExpenseByClassification(
        { userId: req.userId, month: req.month },
      )

      const dailyRecommendedExpenditure =
        this.calculateDailyRecommendedExpenditure(budget, expense)

      const usageStatus = this.calculateUsageStatus(
        dailyRecommendedExpenditure,
        expense,
      )

      const payload = [
        {
          name: '오늘의 지출량 안내',
          value: '',
          inline: true,
        },
      ]

      for (const [classification, item] of usageStatus.entries()) {
        payload[0].value += `${classification} : ${this.amountForm(
          item.usagePercentage,
        )}% (${item.status})\n`
      }

      const message = payloads.EVENING_CONSULTING(payload)

      this.sendDiscord(webUrl, message)

      return usageStatus
    } catch (error) {
      throw new ConflictException('오늘의 지출안내 불러오기에 실패했습니다.')
    }
  }

  async sendDiscord(discordUrl: string, data: object) {
    await this.httpService.post(discordUrl, data).subscribe({
      complete: () => {
        console.log('completed')
      },
      error: (err) => {
        console.log(err)
      },
    })
  }
}
