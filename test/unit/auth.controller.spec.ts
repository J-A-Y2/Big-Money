import { UserRepository } from '@user/infra/userRepository'
import { MockService } from './../mockFactory'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from '@auth/interface/auth.controller'
import { LocalAuthGuard } from '@auth/infra/passport/guards/local.guard'
import { JwtAuthGuard } from '@auth/infra/passport/guards/jwt.guard'
import {
  IHANDLE_DATE_TIME,
  IAUTH_SERVICE,
  IUSER_REPOSITORY,
} from '@common/constants/provider.constant'
import { getDeviceInfo } from '@common/utils/deviceInfo'
import { Request, Response } from 'express'
import { GoogleAuthGuard } from '@auth/infra/passport/guards/google.guard'
import { KakaoAuthGuard } from '@auth/infra/passport/guards/kakao.guard'
import { MockServiceFactory } from '../mockFactory'
import { AuthService } from '@auth/app/auth.service'
import { ReqCheckPasswordDto } from '@auth/interface/dto/checkPassword.dto'
import { ConfigService } from '@nestjs/config'

describe('AuthController', () => {
  let authController: AuthController
  let authService: MockService<AuthService>
  let handleDateTime: any
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: IAUTH_SERVICE,
          useValue: MockServiceFactory.getMockService(AuthService),
        },
        {
          provide: IHANDLE_DATE_TIME,
          useValue: {
            getFewDaysLater: jest.fn().mockReturnValue(new Date()),
            getFewHoursLater: jest.fn().mockReturnValue(new Date()),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret'
              if (key === 'JWT_EXPIRATION_TIME') return '3600'
              return null
            }),
          },
        },
        {
          provide: IUSER_REPOSITORY,
          useValue: MockServiceFactory.getMockService(UserRepository),
        },
        LocalAuthGuard,
        JwtAuthGuard,
        GoogleAuthGuard,
        KakaoAuthGuard,
      ],
    }).compile()
    authController = module.get<AuthController>(AuthController)
    authService = module.get(IAUTH_SERVICE)
    handleDateTime = module.get(IHANDLE_DATE_TIME)

    mockRequest = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Mozilla/5.0' },
      cookies: {
        refreshToken: 'refreshToken',
      },
      user: {
        id: 'userId',
      },
    }

    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      send: jest.fn(),
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(authController).toBeDefined()
  })

  describe('validateLoggedIn', () => {
    it('should return true if logged in', async () => {
      const result = await authController.validateLoggedIn()
      expect(result).toBe(true)
    })
  })

  describe('login', () => {
    it('should handle login and set cookies', async () => {
      const req = mockRequest as Request
      const res = mockResponse as Response

      authService.login.mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      })

      await authController.login(req, res)

      expect(authService.login).toHaveBeenCalledWith({
        id: req.user.id,
        ip: req.ip,
        device: getDeviceInfo(req),
      })
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'accessToken',
        expect.any(Object),
      )
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refreshToken',
        expect.any(Object),
      )
      expect(res.send).toHaveBeenCalledWith('ok')
    })
  })

  describe('googleRedirect', () => {
    it('should handle google redirect login and set cookies', async () => {
      const req = mockRequest as Request
      const res = mockResponse as Response

      authService.login.mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      })

      await authController.googleRedirect(req, res)

      expect(authService.login).toHaveBeenCalledWith({
        id: req.user.id,
        ip: req.ip,
        device: getDeviceInfo(req),
      })
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'accessToken',
        expect.any(Object),
      )
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refreshToken',
        expect.any(Object),
      )
      expect(res.send).toHaveBeenCalledWith('ok')
    })
  })

  describe('kakaoLogin', () => {
    it('should handle kakao login and set cookies', async () => {
      const req = mockRequest as Request
      const res = mockResponse as Response

      authService.login.mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      })

      await authController.kakaoLogin(req, res)

      expect(authService.login).toHaveBeenCalledWith({
        id: req.user.id,
        ip: req.ip,
        device: getDeviceInfo(req),
      })
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'accessToken',
        expect.any(Object),
      )
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refreshToken',
        expect.any(Object),
      )
      expect(res.send).toHaveBeenCalledWith('ok')
    })
  })

  describe('logout', () => {
    it('should handle logout and clear cookies', async () => {
      const res = mockResponse as Response

      await authController.logout('userId', res)

      expect(authService.logout).toHaveBeenCalledWith({ id: 'userId' })
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
        httpOnly: true,
      })
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
      })
      expect(res.send).toHaveBeenCalledWith('ok')
    })
  })

  describe('refresh', () => {
    it('should handle refresh token and set new access token cookie', async () => {
      const req = mockRequest as Request
      const res = mockResponse as Response

      authService.refresh.mockResolvedValue({
        accessToken: 'newAccessToken',
      })

      await authController.refresh(req, res)

      expect(authService.refresh).toHaveBeenCalledWith({
        refreshToken: req.cookies.refreshToken,
        ip: req.ip,
        device: getDeviceInfo(req),
      })
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'newAccessToken',
        expect.any(Object),
      )
      expect(res.send).toHaveBeenCalled()
    })

    it('should handle refresh token failure and clear cookies', async () => {
      const req = mockRequest as Request
      const res = mockResponse as Response

      authService.refresh.mockRejectedValue(new Error('Invalid token'))

      await authController.refresh(req, res)

      expect(authService.refresh).toHaveBeenCalledWith({
        refreshToken: req.cookies.refreshToken,
        ip: req.ip,
        device: getDeviceInfo(req),
      })
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
        httpOnly: true,
      })
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
      })
      expect(res.send).toHaveBeenCalledWith('ok')
    })
  })

  describe('checkPassword', () => {
    it('should check password', async () => {
      const body: ReqCheckPasswordDto = { password: 'testPassword' }
      await authController.checkPassword('userId', body)

      expect(authService.checkPassword).toHaveBeenCalledWith({
        id: 'userId',
        password: body.password,
      })
    })
  })
})
