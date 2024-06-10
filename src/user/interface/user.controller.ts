import {
  HttpCode,
  Post,
  Body,
  Inject,
  HttpStatus,
  Controller,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Delete,
  Patch,
  UseInterceptors,
  Query,
  Req,
} from '@nestjs/common'
import { ReqRegisterDto, ReqUpdateDto } from './dto/registerUserDto'
import { IUSER_SERVICE } from '@common/constants/provider.constant'
import {
  CreateUser,
  IUserService,
} from '@user/domain/interface/user.service.interface'
import { JwtAuthGuard } from '@auth/infra/passport/guards/jwt.guard'
import { CurrentUser } from '@common/decorators/user.decorator'
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { UndefinedToNullInterceptor } from '@common/interceptors/undefinedToNull.interceptor'
import { Request } from 'express'

@UseInterceptors(UndefinedToNullInterceptor)
@ApiTags('USER')
@Controller('users')
export class UserController {
  constructor(
    @Inject(IUSER_SERVICE)
    private readonly userService: IUserService,
  ) {}

  @ApiOperation({
    summary: '회원가입',
    description: '유저를 등록합니다.',
  })
  @ApiCreatedResponse({ description: 'success' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: ReqRegisterDto): Promise<CreateUser> {
    return await this.userService.register(body)
  }

  @ApiOperation({
    summary: '유저 정보 수정',
    description: '유저 정보를 수정합니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Patch()
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: string,
    @Body() body: ReqUpdateDto,
  ): Promise<void> {
    await this.userService.updateUser(user, body)
  }

  @ApiOperation({
    summary: '유저 정보 삭제',
    description: '유저 정보를 삭제합니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Delete()
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: string): Promise<void> {
    await this.userService.deleteUser(user)
  }

  @Post('/email-verify')
  async verifyEmail(
    @Req() req: Request,
    @Query('signupVerifyToken') signupVerifyToken: string,
  ): Promise<void> {
    await this.userService.verifyEmail(signupVerifyToken, req)
  }
}
