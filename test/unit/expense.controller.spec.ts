import { TestBed } from '@automock/jest'
import { ExpenseController } from '@expense/interface/expense.controller'
import { IExpenseService } from '@expense/domain/interface/expense.service.interface'
import { IRecommendationService } from '@expense/app/recommendation.service.interface'
import {
  ReqExpenseDto,
  ResClassificationExpenseDto,
  ResDetailExpenseDto,
  ResGetExpenseDto,
} from '@expense/domain/dto/expense.app.dto'
import {
  IEXPENSE_SERVICE,
  IRECOMMENDATION_SERVICE,
} from '@common/constants/provider.constant'
import { NotFoundException } from '@nestjs/common'

describe('ExpenseController', () => {
  let expenseController: ExpenseController
  let expenseService: jest.Mocked<IExpenseService>
  let recommendationService: jest.Mocked<IRecommendationService>

  const reqExpenseDto: ReqExpenseDto = {
    userId: 'testUserId',
    amount: 1000,
    classificationId: 1,
    memo: 'Lunch',
    date: new Date(),
    exception: false,
  }

  const resDetailExpenseDto: ResDetailExpenseDto = {
    id: 1,
    date: new Date(),
    amount: 15000,
    memo: '병원진료',
  }

  const userId = 'testUser'
  const month = '2024-01'

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(ExpenseController).compile()
    expenseController = unit
    expenseService = unitRef.get(IEXPENSE_SERVICE)
    recommendationService = unitRef.get(IRECOMMENDATION_SERVICE)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(expenseController).toBeDefined()
  })

  describe('createExpense', () => {
    it('should create an expense', async () => {
      const result = 'Expense created successfully'
      expenseService.createExpense.mockResolvedValue(result)

      expect(await expenseController.createExpense(userId, reqExpenseDto)).toBe(
        result,
      )
      expect(expenseService.createExpense).toHaveBeenCalledWith({
        userId,
        ...reqExpenseDto,
      })
    })
  })

  describe('updateExpense', () => {
    it('should update an expense', async () => {
      await expenseController.updateExpense(1, userId, reqExpenseDto)

      expect(expenseService.updateExpense).toHaveBeenCalledWith(
        1,
        userId,
        reqExpenseDto,
      )
    })
  })

  describe('getRecommendExpenditure', () => {
    it('should return recommended expenditure', async () => {
      const result = { recommendation: 'Spend wisely' }
      recommendationService.recommendExpenditure.mockResolvedValue(result)

      expect(
        await expenseController.getRecommendExpenditure(userId, month),
      ).toBe(result)
      expect(recommendationService.recommendExpenditure).toHaveBeenCalledWith({
        userId,
        month,
      })
    })
  })

  describe('getTodayUsage', () => {
    it('should return today usage', async () => {
      const result = { usage: 5000 }
      recommendationService.todayUsage.mockResolvedValue(result)

      expect(await expenseController.getTodayUsage(userId, month)).toBe(result)
      expect(recommendationService.todayUsage).toHaveBeenCalledWith({
        userId,
        month,
      })
    })
  })

  describe('getMonthlyExpense', () => {
    it('should return monthly expense', async () => {
      const result = { '1월 총 지출': 100000 }
      expenseService.getMonthlyExpense.mockResolvedValue(result)

      expect(await expenseController.getMonthlyExpense(userId, month)).toBe(
        result,
      )
      expect(expenseService.getMonthlyExpense).toHaveBeenCalledWith({
        userId,
        month,
      })
    })
  })

  describe('getAllExpense', () => {
    it('should return all expenses for the month', async () => {
      const result: ResGetExpenseDto[] = [
        {
          id: 1,
          date: new Date(),
          amount: 15000,
          classification: '의료/건강',
        },
      ]
      expenseService.getAllExpense.mockResolvedValue(result)

      expect(await expenseController.getAllExpense(userId, month)).toBe(result)
      expect(expenseService.getAllExpense).toHaveBeenCalledWith({
        userId,
        month,
      })
    })
  })

  describe('getTotalExpenseByClassification', () => {
    it('should return total expenses by classification', async () => {
      const result: ResClassificationExpenseDto[] = [
        {
          classificationId: 1,
          total: '0',
        },
      ]
      expenseService.getTotalExpenseByClassification.mockResolvedValue(result)

      expect(
        await expenseController.getTotalExpenseByClassification(userId, month),
      ).toBe(result)
      expect(
        expenseService.getTotalExpenseByClassification,
      ).toHaveBeenCalledWith({
        userId,
        month,
      })
    })
  })

  describe('getExpense', () => {
    it('should return an expense detail', async () => {
      expenseService.getExpense.mockResolvedValue(resDetailExpenseDto)

      expect(await expenseController.getExpense(userId, 1)).toBe(
        resDetailExpenseDto,
      )
      expect(expenseService.getExpense).toHaveBeenCalledWith(1, userId)
    })
  })
})
