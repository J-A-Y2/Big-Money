import { TestBed } from '@automock/jest'
import { BudgetService } from '@budget/app/budget.service'
import { IBudgetRepository } from '@budget/domain/interface/budget.repository.interface'
import { IBUDGET_REPOSITORY } from '@common/constants/provider.constant'
import {
  ReqBudgetDto,
  ReqRecommendBudgetDto,
  ResGetMonthlyBudgetDto,
  ReqGetMonthlyBudgetDto,
} from '@budget/domain/dto/budget.app.dto'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { calculateRecommendedBudget } from '@common/utils/budgetRecommend'
import { Classification } from '@classification/domain/classification.entity'

jest.mock('@common/utils/budgetRecommend', () => ({
  calculateBudget: jest.fn(),
  calculateRecommendedBudget: jest.fn(),
}))

describe('BudgetService', () => {
  let budgetService: BudgetService
  let budgetRepository: jest.Mocked<IBudgetRepository>

  // 공통으로 사용할 테스트 데이터
  const reqBudgetDto: ReqBudgetDto = {
    userId: 'testUserId',
    month: '2024-01',
    amount: {
      '1': 2000,
      '2': 26000,
      '3': 32000,
      '4': 16200,
    },
  }

  const reqRecommendBudgetDto: ReqRecommendBudgetDto = {
    userId: 'testUserId',
    month: '2024-01',
    total: 50000,
  }

  const reqGetMonthlyBudgetDto: ReqGetMonthlyBudgetDto = {
    userId: 'testUserId',
    month: '2024-01',
  }

  const classification: Classification = {
    id: 1,
    classification: 'Food',
    expenses: [],
    hasId: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  }

  const expectedMonthlyBudget: ResGetMonthlyBudgetDto[] = [
    {
      id: 1,
      amount: 1220,
      month: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      classification,
    },
  ]

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(BudgetService).compile()

    budgetService = unit
    budgetRepository = unitRef.get(IBUDGET_REPOSITORY)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createBudget', () => {
    it('should create a budget successfully', async () => {
      budgetRepository.findMonthlyBudget.mockResolvedValue([])

      const result = await budgetService.createBudget(reqBudgetDto)

      expect(result).toBe('예산 설정에 성공하였습니다.')
      expect(budgetRepository.findMonthlyBudget).toHaveBeenCalledWith(
        reqBudgetDto.userId,
        new Date(reqBudgetDto.month),
      )
      expect(budgetRepository.createBudget).toHaveBeenCalledTimes(4)
    })

    it('should throw ConflictException if budget already exists', async () => {
      budgetRepository.findMonthlyBudget.mockResolvedValue([
        {} as ResGetMonthlyBudgetDto,
      ])

      await expect(budgetService.createBudget(reqBudgetDto)).rejects.toThrow(
        ConflictException,
      )
    })
  })

  describe('updateBudget', () => {
    it('should update a budget successfully', async () => {
      budgetRepository.findMonthlyBudget.mockResolvedValue([
        {} as ResGetMonthlyBudgetDto,
      ])

      await budgetService.updateBudget(reqBudgetDto)

      expect(budgetRepository.updateBudget).toHaveBeenCalledTimes(4)
    })

    it('should throw NotFoundException if budget does not exist', async () => {
      budgetRepository.findMonthlyBudget.mockResolvedValue([])

      await expect(budgetService.updateBudget(reqBudgetDto)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('recommendBudget', () => {
    it('should return recommended budget successfully', async () => {
      const findBudgetRatio = { '1': 0.1, '2': 0.2, '3': 0.3, '4': 0.4 }
      const expectedResult = {
        message: '정상적으로 추천 예산이 생성되었습니다.',
        recommendedBudget: {},
      }

      budgetRepository.getMonthlyBudgetRatio.mockResolvedValue(findBudgetRatio)
      ;(calculateRecommendedBudget as jest.Mock).mockReturnValue(
        expectedResult.recommendedBudget,
      )

      const result = await budgetService.recommendBudget(reqRecommendBudgetDto)

      expect(result).toEqual(expectedResult)
      expect(budgetRepository.getMonthlyBudgetRatio).toHaveBeenCalledWith(
        new Date(reqRecommendBudgetDto.month),
        reqRecommendBudgetDto.userId,
      )
      expect(calculateRecommendedBudget).toHaveBeenCalledWith(
        findBudgetRatio,
        expect.any(Function),
      )
    })
  })

  describe('monthlyBudget', () => {
    it('should return monthly budget successfully', async () => {
      budgetRepository.findMonthlyBudget.mockResolvedValue(
        expectedMonthlyBudget,
      )

      const result = await budgetService.monthlyBudget(reqGetMonthlyBudgetDto)

      expect(result).toEqual(expectedMonthlyBudget)
      expect(budgetRepository.findMonthlyBudget).toHaveBeenCalledWith(
        reqGetMonthlyBudgetDto.userId,
        new Date(reqGetMonthlyBudgetDto.month),
      )
    })

    it('should throw NotFoundException if monthly budget does not exist', async () => {
      budgetRepository.findMonthlyBudget.mockResolvedValue([])

      await expect(
        budgetService.monthlyBudget(reqGetMonthlyBudgetDto),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
