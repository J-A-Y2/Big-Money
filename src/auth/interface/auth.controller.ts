import {
  Controller,
  Post,
  Req,
  UseGuards,
  Res,
  Get,
  Inject,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { LocalAuthGuard } from '@auth/infra/passport/guards/local.guard'
import { Request, Response } from 'express'
import { JwtAuthGuard } from '@auth/infra/passport/guards/jwt.guard'
import { IAuthService } from '@auth/domain/interfaces/auth.service.interface'
import { ReqCheckPasswordDto } from './dto/checkPassword.dto'
import { jwtExpiration } from '@common/configs/jwt.config'
import { IHandleDateTime } from '@common/interfaces/IHandleDateTime'
import {
  IAUTH_SERVICE,
  IHANDLE_DATE_TIME,
} from '@common/constants/provider.constant'
import * as useragent from 'useragent' // User-Agent 문자열을 파싱
import { CurrentUser } from '@common/decorators/user.decorator'
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'

@ApiTags('AUTH')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(IAUTH_SERVICE)
    private readonly authService: IAuthService,
    @Inject(IHANDLE_DATE_TIME)
    private readonly handleDateTime: IHandleDateTime,
  ) {}

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async validateLoggedIn() {
    return true
  }

  @ApiOperation({
    summary: '로그인',
    description: '로그인을 합니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: Request, @Res() res: Response): Promise<void> {
    const os = useragent.parse(req.headers['user-agent'])
    const browser = os.family
    const platform = os.os.family
    const version = `${os.major}.${os.minor}.${os.patch}`

    const { accessToken, refreshToken } = await this.authService.login({
      id: req.user.id,
      ip: req.ip,
      device: { browser, platform, version },
    })

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: this.handleDateTime.getFewHoursLater(
        jwtExpiration.accessTokenExpirationHours,
      ),
    })
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: this.handleDateTime.getFewDaysLater(
        jwtExpiration.refreshTokenExpirationDays,
      ),
    })
    res.send('ok')
  }

  @ApiOperation({
    summary: '로그아웃',
    description: '로그아웃을 합니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.logout({ id: user })
    res.clearCookie('accessToken', { httpOnly: true })
    res.clearCookie('refreshToken', { httpOnly: true })
    res.send('ok')
  }

  @ApiOperation({
    summary: '리프레쉬 토큰 확인',
    description: '새로운 토큰을 발급합니다',
  })
  @ApiOkResponse({ description: 'ok' })
  @Post('refresh')
  @HttpCode(HttpStatus.CREATED)
  async refresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const { refreshToken } = req.cookies

      const os = useragent.parse(req.headers['user-agent'])
      const browser = os.family
      const platform = os.os.family
      const version = `${os.major}.${os.minor}.${os.patch}`

      const { accessToken } = await this.authService.refresh({
        refreshToken,
        ip: req.ip,
        device: { browser, platform, version },
      })
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: this.handleDateTime.getFewDaysLater(
          jwtExpiration.refreshTokenExpirationDays,
        ),
      })
      res.send()
    } catch (error) {
      res.clearCookie('accessToken', { httpOnly: true })
      res.clearCookie('refreshToken', { httpOnly: true })
      res.send('ok')
    }
  }

  @ApiOperation({
    summary: '비밀번호 확인',
    description: '비밀번호를 확인합니다.',
  })
  @ApiOkResponse({ description: 'ok' })
  @Post('check-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async checkPassword(
    @CurrentUser() user: string,
    @Body() body: ReqCheckPasswordDto,
  ): Promise<void> {
    await this.authService.checkPassword({ id: user, password: body.password })
  }
}
