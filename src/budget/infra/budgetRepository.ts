import { Injectable } from '@nestjs/common'
import { Budget } from '@budget/domain/budget.entity'
import { IBudgetRepository } from '@budget/domain/interface/budget.repository.interface'
import { plainToClass } from 'class-transformer'
import { Repository, DeepPartial } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { ResGetMonthlyBudgetDto } from '@budget/domain/dto/budget.app.dto'

@Injectable()
export class BudgetRepository implements IBudgetRepository {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
  ) {}

  async createBudget(
    userId: string,
    month: Date,
    classification: number,
    amount: number,
  ): Promise<Budget> {
    const result = await this.budgetRepository.save({
      user: { id: userId }, // user_id를 user 객체로 변경
      month,
      classification,
      amount,
    } as DeepPartial<Budget>) // 형변환 추가
    return plainToClass(Budget, result)
  }

  // async findBudgetByDate(yearMonth: Date, userId: string): Promise<object> {
  //   const monthlyBudget = await this.budgetRepository.find({
  //     where: {
  //       month: yearMonth,
  //       user: { id: userId },
  //     },
  //   })
  //   return monthlyBudget
  // }

  async findBudgetByClassification(
    userId: string,
    classificationId: number,
    month: Date,
  ): Promise<object> {
    const budget = await this.budgetRepository.find({
      where: {
        user: { id: userId },
        classification: { id: classificationId },
        month: month,
      },
    })
    return budget
  }

  async findMonthlyBudget(
    userId: string,
    month: Date,
  ): Promise<ResGetMonthlyBudgetDto[]> {
    const budget = await this.budgetRepository.find({
      where: { user: { id: userId }, month: month },
      relations: ['classification'],
    })
    return budget
  }

  async updateBudget(
    userId: string,
    month: Date,
    classification: number,
    amount: number,
  ): Promise<void> {
    try {
      const existingBudget = await this.budgetRepository.findOne({
        where: {
          user: { id: userId },
          month,
          classification: { id: classification },
        },
      })

      if (existingBudget) {
        existingBudget.amount = amount
        await existingBudget.save()
      }
    } catch (error) {
      throw new Error(`Failed : ${error.message}`)
    }
  }
  async getMonthlyBudgetRatio(month: Date, userId: string): Promise<object> {
    try {
      const query = this.budgetRepository
        .createQueryBuilder('budget')
        .select('budget.classification_id', 'classificationId')
        .addSelect('SUM(budget.amount)', 'totalBudget')
        .addSelect(
          'ROUND((CAST(SUM(budget.amount) AS NUMERIC) / (SELECT CAST(SUM(amount) AS NUMERIC) FROM budget WHERE month = :month)) * 100, 2)',
          'budgetRatio',
        )
        .where('budget.month = :month AND budget.user_id = :userId', {
          month,
          userId,
        }) // month와 userId 기준으로 필터링
        .groupBy('budget.classification_id')

      const categories = await query.getRawMany()

      const budgetRatio = categories.reduce(
        (acc, { classificationId, budgetRatio }) => {
          acc[classificationId] = parseFloat(budgetRatio)
          return acc
        },
        {},
      )

      return budgetRatio
    } catch (error) {
      throw new Error(`Failed : ${error.message}`)
    }
  }
}
