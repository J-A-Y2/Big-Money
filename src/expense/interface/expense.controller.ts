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

  @ApiOperation({ summary: '오늘 지출 추천 API' })
  @ApiOkResponse({ description: 'ok' })
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  @Get('recommendExpenditure')
  async getRecommendExpenditure(
    @CurrentUser() user: string,
    @Query() month: ReqMonthlyDto,
  ) {
    const result = await this.recommendationService.recommendExpenditure({
      userId: user,
      ...month,
    })
    return result
  }

  @ApiOperation({ summary: '오늘 지출량 안내 API' })
  @ApiOkResponse({ description: 'ok' })
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  @Get('todayUsage')
  async getTodayUsage(
    @CurrentUser() user: string,
    @Query() month: ReqMonthlyDto,
  ) {
    const result = await this.recommendationService.todayUsage({
      userId: user,
      ...month,
    })
    return result
  }

  @ApiOperation({
    summary: '지출 내역을 한달 단위로 불러옵니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Get()
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  async getMonthlyExpense(
    @CurrentUser() user: string,
    @Query() month: ReqMonthlyDto,
  ): Promise<object> {
    const monthlyExpenses = await this.expenseService.getMonthlyExpense({
      userId: user,
      ...month,
    })
    return monthlyExpenses
  }

  @ApiOperation({
    summary: '한달 전체 지출 내역을 리스트 형태로 불러옵니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Get('list')
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  async getAllExpense(
    @CurrentUser() user: string,
    @Query() month: ReqMonthlyDto,
  ): Promise<ResGetExpenseDto[]> {
    const getAllExpense = await this.expenseService.getAllExpense({
      userId: user,
      ...month,
    })
    return getAllExpense
  }

  @ApiOperation({
    summary: '지출 내역을 카테로리별로 묶어서 불러옵니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Get('classification')
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  async getTotalExpenseByClassification(
    @CurrentUser() user: string,
    @Query() month: ReqMonthlyDto,
  ): Promise<ResClassificationExpenseDto[]> {
    const getTotalExpenseByClassification =
      await this.expenseService.getTotalExpenseByClassification({
        userId: user,
        ...month,
      })
    return getTotalExpenseByClassification
  }

  @ApiOperation({
    summary: '지출 내용 불러오기',
    description: '지출 내역을 불러옵니다.',
  })
  @ApiOkResponse({ description: 'ok' })
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

  // @Put()
  // @UsePipes(ValidationPipe)
  // @HttpCode(HttpStatus.OK)
  // async updateExpense(
  //   @Req() req: Request,
  //   @Body() expense: ReqExpenseDto,
  // ): Promise<string> {
  //   const userId = req.user.id
  //   const expenses = await this.expenseService.updateExpense({
  //     userId,
  //     ...expense,
  //   })
  //   return expenses
  // }
}
