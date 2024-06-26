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
import { CurrentUser } from '@common/decorators/user.decorator'
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { getDeviceInfo } from '@common/utils/deviceInfo'
import { GoogleAuthGuard } from '@auth/infra/passport/guards/google.guard'
import { KakaoAuthGuard } from '@auth/infra/passport/guards/kakao.guard'

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
    await this.handleLogin(req, res)
  }

  @Get('/google/redirect')
  @ApiOperation({
    summary: '구글 로그인 콜백',
    description: '구글 로그인 후 처리를 담당합니다.',
  })
  @UseGuards(GoogleAuthGuard)
  async googleRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.handleLogin(req, res)
  }

  @Get('/login/kakao')
  @ApiOperation({
    summary: '카카오 로그인',
    description: '카카오 로그인 후 처리를 담당합니다.',
  })
  @UseGuards(KakaoAuthGuard)
  async kakaoLogin(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handleLogin(req, res)
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
      const { accessToken } = await this.authService.refresh({
        refreshToken,
        ip: req.ip,
        device: getDeviceInfo(req),
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

  private async handleLogin(req: Request, res: Response): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.login({
      id: req.user.id,
      ip: req.ip,
      device: getDeviceInfo(req),
    })

    console.log('accessToken1', accessToken)

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
}
