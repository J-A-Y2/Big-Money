import { Inject, Injectable, Logger, ConflictException } from '@nestjs/common'
import {
  USER_ALREADY_EXIST,
  USER_NOT_FOUND,
} from '@common/messages/user/user.errors'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { IUserRepository } from '@user/domain/interface/user.repository.interface'
import {
  ReqRegisterAppDto,
  ReqUpdateUserAppDto,
} from '@user/domain/dto/register.app.dto'
import {
  IPASSWORD_HASHER,
  IUSER_REPOSITORY,
} from '@common/constants/provider.constant'
import { IUserService } from '@user/domain/interface/user.service.interface'
import { IPasswordHasher } from '@common/interfaces/IPasswordHasher'
import { REGISTER_SUCCESS_MESSAGE } from '@common/messages/user/user.messages'
import { User } from '@user/domain/entity/user.entity'

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @Inject(IUSER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(IPASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async register(newUser: ReqRegisterAppDto): Promise<User> {
    const { email, password, name, nickname, birthdate, age, gender } = newUser

    const existingUser = await this.userRepository.findByEmail(email)

    if (existingUser) {
      throw new ConflictException(USER_ALREADY_EXIST)
    }

    const hashedPassword = await this.passwordHasher.hashPassword(password)

    const createdUser = await this.userRepository.createUser(
      email,
      hashedPassword,
      name,
      nickname,
      birthdate,
      age,
      gender,
    )

    this.logger.log(
      'info',
      `${REGISTER_SUCCESS_MESSAGE}- 가입 이메일:${createdUser.email}, 유저 ID:${createdUser.id}, 가입 일시:${createdUser.createdAt}`,
    )
    return createdUser
  }

  async updateUser(userId: string, body: ReqUpdateUserAppDto): Promise<object> {
    const existingUser = await this.userRepository.findById(userId)

    if (!existingUser) {
      throw new ConflictException(USER_NOT_FOUND)
    }
    const updatedUser = await this.userRepository.updateUser(userId, body)

    return { message: '유저 정보 업데이트에 성공했습니다', updatedUser }
  }

  async deleteUser(userId: string): Promise<object> {
    const existingUser = await this.userRepository.findById(userId)

    if (!existingUser) {
      throw new ConflictException(USER_NOT_FOUND)
    }

    const deletedUser = await this.userRepository.deleteUser(userId)
    return { message: '회원탈퇴에 성공했습니다.', deletedUser }
  }
}
