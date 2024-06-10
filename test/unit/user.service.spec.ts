import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from '@user/app/user.service'
import {
  ReqRegisterAppDto,
  ReqUpdateUserAppDto,
} from '@user/domain/dto/register.app.dto'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import {
  IUSER_REPOSITORY,
  ICACHE_SERVICE,
  IPASSWORD_HASHER,
  IEMAIL_SERVICE,
  IAUTH_SERVICE,
} from '@common/constants/provider.constant'
import { UserRepository } from '@user/infra/userRepository'
import { MockRepository, MockRepositoryFactory } from '../mockFactory'
import { ResLoginAppDto } from '@auth/domain/dto/login.app.dto'
import { getDeviceInfo } from '@common/utils/deviceInfo'
import { Request } from 'express'

describe('UserService', () => {
  let userService: UserService
  let userRepository: MockRepository<UserRepository>
  let emailService: { sendMemberJoinVerification: jest.Mock }
  let authService: { login: jest.Mock }
  let passwordHasher: { hashPassword: jest.Mock }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: IUSER_REPOSITORY,
          useValue: MockRepositoryFactory.getMockRepository(UserRepository),
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() }, // 최소한의 모킹된 구현 제공
        },
        {
          provide: ICACHE_SERVICE,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() }, // 최소한의 모킹된 구현 제공
        },
        {
          provide: IPASSWORD_HASHER,
          useValue: {
            hashPassword: jest.fn().mockResolvedValue('hashedPassword'),
            compare: jest.fn().mockResolvedValue(true),
          }, // 최소한의 모킹된 구현 제공
        },
        {
          provide: IEMAIL_SERVICE,
          useValue: {
            sendMemberJoinVerification: jest.fn().mockResolvedValue(true),
          }, // 최소한의 모킹된 구현 제공
        },
        {
          provide: IAUTH_SERVICE,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
          }, // 최소한의 모킹된 구현 제공
        },
      ],
    }).compile()

    userService = module.get<UserService>(UserService)
    userRepository = module.get(IUSER_REPOSITORY)
    emailService = module.get(IEMAIL_SERVICE)
    authService = module.get(IAUTH_SERVICE)
    passwordHasher = module.get(IPASSWORD_HASHER)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(userService).toBeDefined()
    expect(userRepository).toBeDefined()
  })

  describe('register', () => {
    const mockUserDto: ReqRegisterAppDto = {
      email: 'testUser@test.com',
      password: '1234@',
      name: '김만수',
      nickname: '만수르부자',
      birthdate: '1997-09-16',
      age: 26,
      gender: '남',
    }

    it('이미 존재하는 계정입니다.', async () => {
      const mockExistingUser = {
        id: 'testUserIdUUID',
        email: 'testUser@test.com',
        password: '1234@',
        name: '김만수',
        nickname: '만수르부자',
        birthdate: '1997-09-16',
        age: 26,
        gender: '남',
      }

      userRepository.findByEmail.mockResolvedValue(mockExistingUser)

      console.log('Before calling register')
      await expect(userService.register(mockUserDto)).rejects.toThrow(
        ConflictException,
      )
      console.log('After calling register')

      expect(userRepository.findByEmail).toHaveBeenCalledWith(mockUserDto.email)
    })
  })

  describe('verifyEmail', () => {
    const mockRequest: Partial<Request> = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Mozilla/5.0' }, // headers 추가
    }
    const mockSignupVerifyToken = 'some-signup-verify-token'
    const mockUser = {
      id: mockSignupVerifyToken,
    }

    it('유저가 존재하지 않으면 NotFoundException을 던진다.', async () => {
      userRepository.findById.mockResolvedValue(null)

      await expect(
        userService.verifyEmail(mockSignupVerifyToken, mockRequest as Request),
      ).rejects.toThrow(NotFoundException)

      expect(userRepository.findById).toHaveBeenCalledWith(
        mockSignupVerifyToken,
      )
    })

    it('유저가 존재하면 로그인 성공.', async () => {
      userRepository.findById.mockResolvedValue(mockUser)
      authService.login.mockResolvedValue({
        accessToken: 'accessToken',
      } as ResLoginAppDto)

      const result = await userService.verifyEmail(
        mockSignupVerifyToken,
        mockRequest as Request,
      )

      expect(result).toEqual({ accessToken: 'accessToken' })
      expect(userRepository.findById).toHaveBeenCalledWith(
        mockSignupVerifyToken,
      )
      expect(authService.login).toHaveBeenCalledWith({
        id: mockSignupVerifyToken,
        ip: mockRequest.ip,
        device: getDeviceInfo(mockRequest as Request),
      })
    })
  })

  describe('updateUser', () => {
    const mockUserId = 'testUserIdUUID'
    const mockUpdateUserDto: ReqUpdateUserAppDto = {
      name: 'Updated Name',
      nickname: 'Updated Nickname',
    }
    const mockExistingUser = {
      id: mockUserId,
      name: 'Existing Name',
    }

    it('유저가 존재하지 않으면 NotFoundException을 던진다.', async () => {
      userRepository.findById.mockResolvedValue(null)

      await expect(
        userService.updateUser(mockUserId, mockUpdateUserDto),
      ).rejects.toThrow(NotFoundException)

      expect(userRepository.findById).toHaveBeenCalledWith(mockUserId)
    })

    it('유저 정보 업데이트에 성공한다.', async () => {
      userRepository.findById.mockResolvedValue(mockExistingUser)
      userRepository.updateUser.mockResolvedValue(mockUpdateUserDto)

      const result = await userService.updateUser(mockUserId, mockUpdateUserDto)

      expect(result).toEqual({
        message: '유저 정보 업데이트에 성공했습니다',
        updatedUser: mockUpdateUserDto,
      })
      expect(userRepository.findById).toHaveBeenCalledWith(mockUserId)
      expect(userRepository.updateUser).toHaveBeenCalledWith(
        mockUserId,
        mockUpdateUserDto,
      )
    })
  })

  describe('deleteUser', () => {
    const mockUserId = 'testUserIdUUID'
    const mockExistingUser = {
      id: mockUserId,
      name: 'Existing Name',
    }

    it('유저가 존재하지 않으면 NotFoundException을 던진다.', async () => {
      userRepository.findById.mockResolvedValue(null)

      await expect(userService.deleteUser(mockUserId)).rejects.toThrow(
        NotFoundException,
      )

      expect(userRepository.findById).toHaveBeenCalledWith(mockUserId)
    })

    it('회원탈퇴에 성공한다.', async () => {
      userRepository.findById.mockResolvedValue(mockExistingUser)
      userRepository.deleteUser.mockResolvedValue(mockExistingUser)

      const result = await userService.deleteUser(mockUserId)

      expect(result).toEqual({
        message: '회원탈퇴에 성공했습니다.',
        deletedUser: mockExistingUser,
      })
      expect(userRepository.findById).toHaveBeenCalledWith(mockUserId)
      expect(userRepository.deleteUser).toHaveBeenCalledWith(mockUserId)
    })
  })
})
