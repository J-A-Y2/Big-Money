import {
  Controller,
  Body,
  Get,
  Post,
  Inject,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common'
import { IExpenseService } from '@expense/domain/interface/expense.service.interface'
import {
  IEXPENSE_SERVICE,
  IRECOMMENDATION_SERVICE,
} from '@common/constants/provider.constant'
import {
  ReqExpenseDto,
  ReqMonthlyDto,
  ResClassificationExpenseDto,
  ResDetailExpenseDto,
  ResGetExpenseDto,
} from '@expense/domain/dto/expense.app.dto'
import { JwtAuthGuard } from '@auth/infra/passport/guards/jwt.guard'
import { IRecommendationService } from '@expense/app/recommendation.service.interface'
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '@common/decorators/user.decorator'

@ApiTags('EXPENSE')
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(
    @Inject(IEXPENSE_SERVICE)
    private readonly expenseService: IExpenseService,
    @Inject(IRECOMMENDATION_SERVICE)
    private readonly recommendationService: IRecommendationService,
  ) {}

  @ApiOperation({
    summary: '지출 생성',
  })
  @ApiCreatedResponse({ description: 'success' })
  @Post()
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.CREATED)
  async createExpense(
    @CurrentUser() user: string,
    @Body() expense: ReqExpenseDto,
  ): Promise<string> {
    const expenses = await this.expenseService.createExpense({
      userId: user,
      ...expense,
    })
    return expenses
  }

  @ApiOperation({
    summary: '지출 수정',
  })
  @ApiCreatedResponse({ description: 'success' })
  @Patch(':id')
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateExpense(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: string,
    @Body() expense: ReqExpenseDto,
  ): Promise<void> {
    await this.expenseService.updateExpense(id, user, expense)
  }

  @ApiOperation({ summary: '오늘 지출 추천 API' })
  @ApiOkResponse({ description: 'ok' })
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  @Get('recommendExpenditure')
  async getRecommendExpenditure(
    @CurrentUser() user: string,
    @Query('month') month: string,
  ) {
    const result = await this.recommendationService.recommendExpenditure({
      userId: user,
      month,
    })
    return result
  }

  @ApiOperation({ summary: '오늘 지출량 안내 API' })
  @ApiOkResponse({ description: 'ok' })
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  @Get('todayUsage')
  async getTodayUsage(@CurrentUser() user: string, @Query() month: string) {
    const result = await this.recommendationService.todayUsage({
      userId: user,
      month,
    })
    return result
  }

  @ApiOperation({
    summary: '지출 내역을 한달 단위로 불러옵니다.',
    description:
      '한달 총 지출 금액과 함께 각 주마다의 총 지출 금액을 보여줍니다.',
  })
  @ApiOkResponse({
    description: 'OK',
    schema: {
      example: {
        '1월 총 지출': 100000,
        '1월 1주': 0,
        '1월 2주': 100000,
        '1월 3주': 0,
        '1월 4주': 0,
      },
    },
  })
  @Get()
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  async getMonthlyExpense(
    @CurrentUser() user: string,
    @Query('month') month: string,
  ): Promise<object> {
    const monthlyExpenses = await this.expenseService.getMonthlyExpense({
      userId: user,
      month,
    })
    return monthlyExpenses
  }

  @ApiOperation({
    summary: '한달 전체 지출 내역을 리스트 형태로 불러옵니다.',
  })
  @ApiOkResponse({
    description: 'OK',
    schema: {
      example: [
        {
          id: 1,
          date: '2024-01-11',
          amount: 15000,
          classification: '의료/건강',
        },
        {
          id: 5,
          date: '2024-01-13',
          amount: 17000,
          classification: '자동차',
        },
        {
          id: 3,
          date: '2024-01-13',
          amount: 17000,
          classification: '자동차',
        },
      ],
    },
  })
  @Get('list')
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  async getAllExpense(
    @CurrentUser() user: string,
    @Query('month') month: string,
  ): Promise<ResGetExpenseDto[]> {
    const getAllExpense = await this.expenseService.getAllExpense({
      userId: user,
      month,
    })
    return getAllExpense
  }

  @ApiOperation({
    summary: '카테로리별 지출 금액을 묶어서 불러옵니다.',
  })
  @ApiOkResponse({
    description: 'OK',
    schema: {
      example: [
        {
          classificationId: 1,
          total: '0',
        },
        {
          classificationId: 2,
          total: '0',
        },
        {
          classificationId: 3,
          total: '0',
        },
        {
          classificationId: 4,
          total: '0',
        },
        {
          classificationId: 5,
          total: '0',
        },
        {
          classificationId: 6,
          total: '0',
        },
        {
          classificationId: 7,
          total: '0',
        },
        {
          classificationId: 8,
          total: '0',
        },
        {
          classificationId: 9,
          total: '14000',
        },
        {
          classificationId: 10,
          total: '0',
        },
        {
          classificationId: 11,
          total: '0',
        },
        {
          classificationId: 12,
          total: '0',
        },
        {
          classificationId: 13,
          total: '15000',
        },
        {
          classificationId: 14,
          total: '0',
        },
        {
          classificationId: 15,
          total: '85000',
        },
        {
          classificationId: 16,
          total: '0',
        },
        {
          classificationId: 17,
          total: '0',
        },
        {
          classificationId: 18,
          total: '0',
        },
      ],
    },
  })
  @Get('classification')
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  async getTotalExpenseByClassification(
    @CurrentUser() user: string,
    @Query('month') month: string,
  ): Promise<ResClassificationExpenseDto[]> {
    const getTotalExpenseByClassification =
      await this.expenseService.getTotalExpenseByClassification({
        userId: user,
        month,
      })
    return getTotalExpenseByClassification
  }

  @ApiOperation({
    summary: '지출 내용 불러오기',
    description: '해당 지출 내역을 불러옵니다.',
  })
  @ApiOkResponse({
    description: 'OK',
    schema: {
      example: {
        id: 1,
        date: '2024-01-11',
        amount: 15000,
        memo: '병원진료',
        exception: false,
        created_at: '2024-05-09T12:25:29.804Z',
        updated_at: '2024-05-09T12:25:29.804Z',
      },
    },
  })
  @Get(':id')
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  async getExpense(
    @CurrentUser() user: string,
    @Param('id', ParseIntPipe) expenseId: number,
  ): Promise<ResDetailExpenseDto> {
    const getExpense = await this.expenseService.getExpense(expenseId, user)
    return getExpense
  }
}
