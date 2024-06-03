import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '@auth/app/auth.service'
import { IUserRepository } from '@user/domain/interface/user.repository.interface'
import {
  ITokenService,
  RefreshInfo,
} from '@auth/domain/interfaces/token.service.interface'
import { ICacheService } from '@cache/cache.service.interface'
import { IPasswordHasher } from '@common/interfaces/IPasswordHasher'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import {
  ICACHE_SERVICE,
  IPASSWORD_HASHER,
  ITOKEN_SERVICE,
  IUSER_REPOSITORY,
} from '@common/constants/provider.constant'
import { ReqValidateUserAppDto } from '@auth/domain/dto/vaildateUser.app.dto'
import { ReqCheckPasswordAppDto } from '@auth/domain/dto/checkPassword.app.dto'
import { ReqLoginAppDto, ResLoginAppDto } from '@auth/domain/dto/login.app.dto'
import { ReqLogoutAppDto } from '@auth/domain/dto/logout.app.dto'
import { MockServiceFactory } from '../mockFactory'
import { UnauthorizedException, NotFoundException } from '@nestjs/common'
import { plainToClass } from 'class-transformer'
import { TokenService } from '@auth/infra/token.sevice'
import { UserRepository } from '@user/infra/userRepository'
import { CacheService } from '@cache/cache.service'
import { PasswordHasher } from '@common/passwordHasher'
import { ReqRefreshAppDto } from '@auth/domain/dto/refresh.app dto'
import { User } from '@user/domain/entity/user.entity'

describe('AuthService', () => {
  let authService: AuthService
  let userRepository: jest.Mocked<IUserRepository>
  let tokenService: jest.Mocked<ITokenService>
  let cacheService: jest.Mocked<ICacheService>
  let passwordHasher: jest.Mocked<IPasswordHasher>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ITOKEN_SERVICE,
          useValue: MockServiceFactory.getMockService(TokenService),
        },
        {
          provide: IUSER_REPOSITORY,
          useValue: MockServiceFactory.getMockService(UserRepository),
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: ICACHE_SERVICE,
          useValue: MockServiceFactory.getMockService(CacheService),
        },
        {
          provide: IPASSWORD_HASHER,
          useValue: MockServiceFactory.getMockService(PasswordHasher),
        },
      ],
    }).compile()

    authService = module.get<AuthService>(AuthService)
    userRepository = module.get(IUSER_REPOSITORY)
    tokenService = module.get(ITOKEN_SERVICE)
    cacheService = module.get(ICACHE_SERVICE)
    passwordHasher = module.get(IPASSWORD_HASHER)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const createMockUser = (): User => ({
    id: 'userId',
    email: 'test@test.com',
    createdAt: new Date(),
    password: 'hashedPassword',
    name: 'name',
    nickname: 'nickname',
    birthdate: '1997-01-01',
    age: 30,
    gender: 'male',
    updatedAt: undefined,
    deleteAt: undefined,
    expenses: [],
    hasId: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  })

  describe('validateUser', () => {
    it('should return user if email and password are correct', async () => {
      const req: ReqValidateUserAppDto = {
        email: 'test@test.com',
        password: 'password',
      }
      const user = createMockUser()
      const userPassword = 'hashedPassword'

      userRepository.findByEmail.mockResolvedValue(user)
      userRepository.findPasswordById.mockResolvedValue(userPassword)
      passwordHasher.comparePassword.mockResolvedValue(true)

      const result = await authService.validateUser(req)
      expect(result).toEqual(user)
    })

    it('should throw NotFoundException if user does not exist', async () => {
      const req: ReqValidateUserAppDto = {
        email: 'test@test.com',
        password: 'password',
      }

      userRepository.findByEmail.mockResolvedValue(null)

      await expect(authService.validateUser(req)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const req: ReqValidateUserAppDto = {
        email: 'test@test.com',
        password: 'password',
      }
      const userPassword = 'hashedPassword'

      userRepository.findPasswordById.mockResolvedValue(userPassword)
      passwordHasher.comparePassword.mockResolvedValue(false)

      await expect(authService.validateUser(req)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('login', () => {
    it('should return access token and refresh token', async () => {
      const req: ReqLoginAppDto = {
        id: 'userId',
        ip: '127.0.0.1',
        device: {
          browser: 'Chrome',
          platform: 'Windows',
          version: '91.0.4472.124',
        },
      }
      const accessToken = 'accessToken'
      const refreshToken = 'refreshToken'

      tokenService.generateAccessToken.mockReturnValue(accessToken)
      tokenService.generateRefreshToken.mockReturnValue(refreshToken)
      cacheService.setCache.mockResolvedValue(undefined)

      const result = await authService.login(req)

      expect(result).toEqual(
        plainToClass(ResLoginAppDto, { accessToken, refreshToken }),
      )
      expect(cacheService.setCache).toHaveBeenCalledWith(
        `refreshToken:${req.id}`,
        { refreshToken, ip: req.ip, device: req.device },
        expect.any(Number),
      )
    })
  })

  describe('checkPassword', () => {
    it('should throw UnauthorizedException if password is incorrect', async () => {
      const req: ReqCheckPasswordAppDto = {
        id: 'userId',
        password: 'wrongPassword',
      }
      const userPassword = 'hashedPassword'

      userRepository.findPasswordById.mockResolvedValue(userPassword)
      passwordHasher.comparePassword.mockResolvedValue(false)

      await expect(authService.checkPassword(req)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should not throw error if password is correct', async () => {
      const req: ReqCheckPasswordAppDto = {
        id: 'userId',
        password: 'correctPassword',
      }
      const userPassword = 'hashedPassword'

      userRepository.findPasswordById.mockResolvedValue(userPassword)
      passwordHasher.comparePassword.mockResolvedValue(true)

      await expect(authService.checkPassword(req)).resolves.not.toThrow()
    })
  })

  describe('logout', () => {
    it('should delete user cache', async () => {
      const req: ReqLogoutAppDto = { id: 'userId' }

      cacheService.deleteCache.mockResolvedValue(undefined)

      await authService.logout(req)

      expect(cacheService.deleteCache).toHaveBeenCalledWith(`user:${req.id}`)
    })
  })

  describe('refresh', () => {
    it('should return new access token if refresh token is valid', async () => {
      const req: ReqRefreshAppDto = {
        refreshToken: 'refreshToken',
        ip: '127.0.0.1',
        device: {
          browser: 'Chrome',
          platform: 'Windows',
          version: '91.0.4472.124',
        },
      }
      const decoded = { id: 'userId' }
      const redisRefreshInfo: RefreshInfo = {
        refreshToken: 'refreshToken',
        ip: '127.0.0.1',
        device: {
          browser: 'Chrome',
          platform: 'Windows',
          version: '91.0.4472.124',
        },
      }
      const user = createMockUser()
      const newAccessToken = 'newAccessToken'

      tokenService.decodeToken.mockReturnValue(decoded)
      cacheService.getFromCache.mockResolvedValue(redisRefreshInfo)
      userRepository.findById.mockResolvedValue(user)
      tokenService.generateAccessToken.mockReturnValue(newAccessToken)

      const result = await authService.refresh(req)

      expect(result).toEqual({ accessToken: newAccessToken })
    })

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const req: ReqRefreshAppDto = {
        refreshToken: 'invalidRefreshToken',
        ip: '127.0.0.1',
        device: {
          browser: 'Chrome',
          platform: 'Windows',
          version: '91.0.4472.124',
        },
      }

      tokenService.decodeToken.mockReturnValue(null)

      await expect(authService.refresh(req)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })
})
