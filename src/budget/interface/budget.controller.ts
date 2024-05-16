import {
  Controller,
  Body,
  Get,
  Post,
  Put,
  Inject,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  Patch,
} from '@nestjs/common'
import { IBudgetService } from '@budget/domain/interface/budget.service.interface'
import { IBUDGET_SERVICE } from '@common/constants/provider.constant'
import {
  ReqBudgetDto,
  ReqRecommendBudgetDto,
  ResGetMonthlyBudgetDto,
} from '@budget/domain/dto/budget.app.dto'
import { JwtAuthGuard } from '@auth/infra/passport/guards/jwt.guard'
import { CurrentUser } from '@common/decorators/user.decorator'
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'

@ApiTags('BUDGET')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(
    @Inject(IBUDGET_SERVICE)
    private readonly budegetService: IBudgetService,
  ) {}

  @ApiOperation({
    summary: '예산 설정',
    description: '예산을 생성합니다.',
  })
  @ApiCreatedResponse({ description: 'success' })
  @Post()
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.CREATED)
  async createBudget(
    @CurrentUser() user: string,
    @Body() budget: ReqBudgetDto,
  ): Promise<string> {
    const budgets = await this.budegetService.createBudget({
      userId: user,
      ...budget,
    })

    return budgets
  }

  @ApiOperation({
    summary: '예산 설정 변경',
    description: '예산 내용을 변경합니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Patch()
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBudget(
    @CurrentUser() user: string,
    @Body() budget: ReqBudgetDto,
  ): Promise<void> {
    await this.budegetService.updateBudget({
      userId: user,
      ...budget,
    })
  }

  @ApiOperation({
    summary: '예산 추천 내용',
    description: '예산 추천 값을 불러옵니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Get()
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  async getRecommendbudget(
    @CurrentUser() user: string,
    @Query() totalBudget: ReqRecommendBudgetDto,
  ): Promise<object> {
    const recommendBudget = await this.budegetService.recommendBudget({
      userId: user,
      ...totalBudget,
    })
    return recommendBudget
  }

  // 예산 불러오기 api 추가하기 (월별 -> 쿼리값으로 년 월 받고 조회)

  @ApiOperation({
    summary: '예산을 월 기준으로 불러옵니다.',
    description: '예산을 월 기준으로 불러옵니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Get('/monthlyBudget')
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  async getMonthlyBudget(
    @CurrentUser() user: string,
    @Query('month') month: string,
  ): Promise<ResGetMonthlyBudgetDto[]> {
    const monthlyBudget = await this.budegetService.monthlyBudget({
      userId: user,
      month,
    })
    return monthlyBudget
  }
}
