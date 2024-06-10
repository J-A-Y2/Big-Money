import { TestBed } from '@automock/jest'
import { ExpenseService } from '@expense/app/expense.service'
import { IExpenseRepository } from '@expense/domain/interface/expense.repository.interface'
import { IBudgetRepository } from '@budget/domain/interface/budget.repository.interface'
import { NotFoundException } from '@nestjs/common'
import {
  ReqExpenseDto,
  ReqMonthlyDto,
  ResClassificationExpenseDto,
  ResDetailExpenseDto,
  ResGetExpenseDto,
} from '@expense/domain/dto/expense.app.dto'
import {
  IBUDGET_REPOSITORY,
  IEXPENSE_REPOSITORY,
} from '@common/constants/provider.constant'

describe('ExpenseService', () => {
  let expenseService: ExpenseService
  let expenseRepository: jest.Mocked<IExpenseRepository>
  let budgetRepository: jest.Mocked<IBudgetRepository>

  const reqExpenseDto: ReqExpenseDto = {
    userId: 'testUserId',
    amount: 1000,
    classificationId: 1,
    memo: 'Lunch',
    date: new Date(),
    exception: false,
  }

  const reqMonthlyDto: ReqMonthlyDto = {
    userId: 'testUserId',
    month: '2024-01',
  }

  const resDetailExpenseDto: ResDetailExpenseDto = {
    id: 1,
    date: new Date(),
    amount: 15000,
    memo: '병원진료',
  }
  const resGetExpenseDto: ResGetExpenseDto[] = [
    {
      id: 1,
      date: new Date(),
      amount: 15000,
      classification: '의료/건강',
    },
  ]

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(ExpenseService).compile()
    expenseService = unit
    expenseRepository = unitRef.get(IEXPENSE_REPOSITORY)
    budgetRepository = unitRef.get(IBUDGET_REPOSITORY)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createExpense', () => {
    it('should create an expense successfully', async () => {
      budgetRepository.findBudgetByClassification.mockResolvedValue([{ id: 1 }])
      const result = await expenseService.createExpense(reqExpenseDto)

      expect(result).toBe('지출 설정에 성공하였습니다.')
      expect(expenseRepository.createExpense).toHaveBeenCalledWith(
        reqExpenseDto,
        1,
      )
    })

    it('should throw NotFoundException if budget is not found', async () => {
      budgetRepository.findBudgetByClassification.mockResolvedValue([])

      await expect(expenseService.createExpense(reqExpenseDto)).rejects.toThrow(
        NotFoundException,
      )
      expect(budgetRepository.findBudgetByClassification).toHaveBeenCalled()
    })
  })

  describe('updateExpense', () => {
    it('should update an expense successfully', async () => {
      expenseRepository.getExpense.mockResolvedValue(resDetailExpenseDto)
      budgetRepository.findBudgetByClassification.mockResolvedValue([{ id: 1 }])

      await expenseService.updateExpense(1, 'testUser', reqExpenseDto)

      expect(expenseRepository.updateExpense).toHaveBeenCalled()
    })

    it('should throw NotFoundException if expense is not found', async () => {
      expenseRepository.getExpense.mockResolvedValue(null)

      await expect(
        expenseService.updateExpense(1, 'testUser', reqExpenseDto),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('getMonthlyExpense', () => {
    it('should return monthly expenses', async () => {
      expenseRepository.getTotalMonthlyExpense.mockResolvedValue({
        total: 100000,
      })
      expenseRepository.getWeeklyExpense.mockResolvedValue({
        '1주': { totalExpense: 50000 },
        '2주': { totalExpense: 50000 },
      })

      const result = await expenseService.getMonthlyExpense(reqMonthlyDto)

      expect(result).toEqual({
        '1월 총 지출': 100000,
        '1월 1주': 50000,
        '1월 2주': 50000,
      })
    })
  })

  describe('getTotalExpenseByClassification', () => {
    it('should return total expenses by classification', async () => {
      const classificationExpensesMock: ResClassificationExpenseDto[] = [
        { classificationId: 1, total: '50000' },
        { classificationId: 2, total: '10000' },
      ]

      const expectedExpenses =
        expenseService.calculateTotalExpenseByClassification(
          classificationExpensesMock,
        )

      expenseRepository.getTotalExpenseByClassification.mockResolvedValue(
        classificationExpensesMock,
      )

      const result =
        await expenseService.getTotalExpenseByClassification(reqMonthlyDto)

      expect(result).toEqual(expectedExpenses)
    })
  })

  describe('getAllExpense', () => {
    it('should return all expenses for the month', async () => {
      expenseRepository.getAllExpense.mockResolvedValue(resGetExpenseDto)

      const result = await expenseService.getAllExpense(reqMonthlyDto)

      expect(result).toEqual(resGetExpenseDto)
    })
  })

  describe('getExpense', () => {
    it('should return an expense detail', async () => {
      expenseRepository.getExpense.mockResolvedValue(resDetailExpenseDto)

      const result = await expenseService.getExpense(1, 'testUser')

      expect(result).toEqual(resDetailExpenseDto)
    })
  })
})
