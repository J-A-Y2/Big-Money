import { Inject, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy } from 'passport-kakao'
import { User } from '@user/domain/entity/user.entity'
import { IUserRepository } from '@user/domain/interface/user.repository.interface'
import { IPASSWORD_HASHER } from '@common/constants/provider.constant'
import { IPasswordHasher } from '@common/interfaces/IPasswordHasher'

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    @Inject(IPASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject('IUserRepository')
    private readonly UserRepository: IUserRepository,
  ) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: process.env.KAKAO_CALLBACK_URL,
      scope: ['account_email', 'profile_nickname'],
    })
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    console.log('accessToken', accessToken)
    console.log('refreshToken', refreshToken)
    console.log('profile', profile)

    const password = String(profile.id)
    const email = profile._json.kakao_account.email
    const hashedPassword = await this.passwordHasher.hashPassword(password)

    const user: User = await this.UserRepository.findByEmailOrSave(
      email,
      profile.displayName,
      hashedPassword,
    )
    return user
  }
}
