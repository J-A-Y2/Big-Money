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
} from '@nestjs/common'
import { IBudgetService } from '@budget/domain/interface/budget.service.interface'
import { IBUDGET_SERVICE } from '@common/constants/provider.constant'
import {
  ReqBudgetDto,
  ReqRecommendBudgetDto,
} from '@budget/domain/dto/budget.app.dto'
import { JwtAuthGuard } from '@auth/infra/passport/guards/jwt.guard'
import { Request } from 'express'
import { CurrentUser } from '@common/decorators/user.decorator'
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger'

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
  @Put()
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  async updateBudget(
    @CurrentUser() user: string,
    @Body() budget: ReqBudgetDto,
  ): Promise<string> {
    const budgets = await this.budegetService.updateBudget({
      userId: user,
      ...budget,
    })
    return budgets
  }

  @ApiOperation({
    summary: '예산 추천 내용',
    description: '예산 추천 값을 불러옵니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Get()
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  async getMonthlybudget(
    @CurrentUser() user: string,
    @Query() totalBudget: ReqRecommendBudgetDto,
  ): Promise<object> {
    const recommendBudget = await this.budegetService.recommendBudget({
      userId: user,
      ...totalBudget,
    })
    return recommendBudget
  }
}
