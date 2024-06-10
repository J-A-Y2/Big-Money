import { Test, TestingModule } from '@nestjs/testing'
import { UserController } from '@user/interface/user.controller'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import {
  IUSER_SERVICE,
  IUSER_REPOSITORY,
  IPASSWORD_HASHER,
  IEMAIL_SERVICE,
} from '@common/constants/provider.constant'
import {
  ReqRegisterDto,
  ReqUpdateDto,
} from '@user/interface/dto/registerUserDto'
import { MockService, MockServiceFactory } from '../mockFactory'
import { UserService } from '@user/app/user.service'
import { ConflictException, ForbiddenException } from '@nestjs/common'

describe('UserController', () => {
  let controller: UserController
  let userService: MockService<UserService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        JwtModule.register({
          secret: 'test_secret',
          signOptions: { expiresIn: '60s' },
        }),
      ],
      controllers: [UserController],
      providers: [
        {
          provide: IUSER_REPOSITORY,
          useValue: {},
        },
        {
          provide: IEMAIL_SERVICE,
          useValue: {},
        },
        {
          provide: IPASSWORD_HASHER,
          useValue: {},
        },
        {
          provide: IUSER_SERVICE,
          useValue: MockServiceFactory.getMockService(UserService),
        },
        ConfigService,
        JwtService,
      ],
    }).compile()

    controller = module.get<UserController>(UserController)
    userService = module.get(IUSER_SERVICE)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('register', () => {
    const mockUserDto: ReqRegisterDto = {
      email: 'testUser@test.com',
      password: '1234@',
      name: '김만수',
      nickname: '만수르부자',
      birthdate: '1997-09-16',
      age: 26,
      gender: '남',
    }

    it('register', async () => {
      const message = { message: '회원가입에 성공했습니다.' }
      userService.register.mockResolvedValue(message)

      const result = await controller.register(mockUserDto)

      expect(userService.register).toHaveBeenCalledWith(mockUserDto)
      expect(result).toEqual(message)
    })

    it('회원가입: 이미 존재하는 유저 이름', async () => {
      userService.register.mockRejectedValue(new ConflictException())

      await expect(controller.register(mockUserDto)).rejects.toThrow(
        ConflictException,
      )
    })
  })

  describe('update', () => {
    it('should update user info', async () => {
      const userId = 'testUserId'
      const updateUserDto: ReqUpdateDto = {
        name: 'newUsername',
        nickname: 'newNickname',
      }
      userService.updateUser.mockResolvedValue(undefined)

      await expect(
        controller.update(userId, updateUserDto),
      ).resolves.not.toThrow()

      expect(userService.updateUser).toHaveBeenCalledWith(userId, updateUserDto)
    })
  })

  describe('delete', () => {
    it('should delete a user', async () => {
      const userId = 'testUserId'
      userService.deleteUser.mockResolvedValue(undefined)

      await expect(controller.delete(userId)).resolves.not.toThrow()

      expect(userService.deleteUser).toHaveBeenCalledWith(userId)
    })
  })
})
