import { Test, TestingModule } from '@nestjs/testing'
import { BudgetController } from '@budget/interface/budget.controller'
import { IBudgetService } from '@budget/domain/interface/budget.service.interface'
import { IBUDGET_SERVICE } from '@common/constants/provider.constant'
import { JwtAuthGuard } from '@auth/infra/passport/guards/jwt.guard'
import {
  ReqBudgetDto,
  ReqRecommendBudgetDto,
  ResGetMonthlyBudgetDto,
} from '@budget/domain/dto/budget.app.dto'
import { MockServiceFactory } from '../mockFactory'
import { BudgetService } from '@budget/app/budget.service'
import { Classification } from '@classification/domain/classification.entity'

describe('BudgetController', () => {
  let budgetController: BudgetController
  let budgetService: jest.Mocked<BudgetService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        {
          provide: IBUDGET_SERVICE,
          useValue: MockServiceFactory.getMockService(BudgetService),
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile()

    budgetController = module.get<BudgetController>(BudgetController)
    budgetService = module.get(IBUDGET_SERVICE)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const reqBudgetDto: ReqBudgetDto = {
    userId: 'testUserId',
    month: '2024-01',
    amount: {
      '1': 2000,
      '2': 26000,
      '3': 32000,
      '4': 16200,
      '5': 58900,
      '6': 50000,
      '7': 50000,
      '8': 35000,
      '9': 50000,
      '10': 45000,
      '11': 200000,
      '12': 65000,
      '13': 45000,
      '14': 32000,
      '15': 300000,
      '16': 3000,
      '17': 15400,
      '18': 12000,
    },
  }

  describe('createBudget', () => {
    it('should create a budget', async () => {
      const userId = 'userId'
      const expectedResult = 'success'

      budgetService.createBudget.mockResolvedValue(expectedResult)

      const result = await budgetController.createBudget(userId, reqBudgetDto)

      expect(result).toEqual(expectedResult)
      expect(budgetService.createBudget).toHaveBeenCalledWith({
        userId,
        ...reqBudgetDto,
      })
    })
  })

  describe('updateBudget', () => {
    it('should update a budget', async () => {
      const userId = 'userId'

      await budgetController.updateBudget(userId, reqBudgetDto)

      expect(budgetService.updateBudget).toHaveBeenCalledWith({
        userId,
        ...reqBudgetDto,
      })
    })
  })

  describe('getRecommendBudget', () => {
    it('should return recommended budget', async () => {
      const reqRecommendBudgetDto: ReqRecommendBudgetDto = {
        userId: 'testUserId',
        month: '2024-01',
        total: 5000,
      }
      const userId = 'userId'
      const expectedResult = { Food: 2000, Entertainment: 1500 }

      budgetService.recommendBudget.mockResolvedValue(expectedResult)

      const result = await budgetController.getRecommendbudget(
        userId,
        reqRecommendBudgetDto,
      )

      expect(result).toEqual(expectedResult)
      expect(budgetService.recommendBudget).toHaveBeenCalledWith({
        userId,
        ...reqRecommendBudgetDto,
      })
    })
  })

  describe('getMonthlyBudget', () => {
    it('should return monthly budget', async () => {
      const month = '2024-05'
      const userId = 'userId'
      const expectedResult: ResGetMonthlyBudgetDto[] = [
        {
          id: 1,
          amount: 1220,
          month: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          classification: new Classification(),
        },
      ]

      budgetService.monthlyBudget.mockResolvedValue(expectedResult)

      const result = await budgetController.getMonthlyBudget(userId, month)

      expect(result).toEqual(expectedResult)
      expect(budgetService.monthlyBudget).toHaveBeenCalledWith({
        userId,
        month,
      })
    })
  })
})
