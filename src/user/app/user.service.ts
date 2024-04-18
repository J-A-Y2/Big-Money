import {
  Inject,
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
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
  IEMAIL_SERVICE,
  IPASSWORD_HASHER,
  IUSER_REPOSITORY,
  IAUTH_SERVICE,
} from '@common/constants/provider.constant'
import { IUserService } from '@user/domain/interface/user.service.interface'
import { IPasswordHasher } from '@common/interfaces/IPasswordHasher'
import { REGISTER_SUCCESS_MESSAGE } from '@common/messages/user/user.messages'
import { User } from '@user/domain/entity/user.entity'
import { IEmailService } from './adapter/email.service.interface'
import { getDeviceInfo } from '@common/utils/deviceInfo'
import { Request } from 'express'
import { IAuthService } from '@auth/domain/interfaces/auth.service.interface'
import { ResLoginAppDto } from '@auth/domain/dto/login.app.dto'

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject(IEMAIL_SERVICE)
    private readonly emailService: IEmailService,
    @Inject(IAUTH_SERVICE)
    private readonly authService: IAuthService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @Inject(IUSER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(IPASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async verifyEmail(
    signupVerifyToken: string,
    req: Request,
  ): Promise<ResLoginAppDto> {
    const user = await this.userRepository.findById(signupVerifyToken)

    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다')
    }

    return this.authService.login({
      id: signupVerifyToken,
      ip: req.ip,
      device: getDeviceInfo(req),
    })
  }

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

    await this.sendMemberJoinEmail(email, createdUser.id)

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

  private async sendMemberJoinEmail(email: string, signupVerifyToken: string) {
    await this.emailService.sendMemberJoinVerification(email, signupVerifyToken)
  }
}
