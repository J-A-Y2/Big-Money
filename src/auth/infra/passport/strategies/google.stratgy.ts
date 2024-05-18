import { Inject, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20'
import { User } from '@user/domain/entity/user.entity'
import { IUserRepository } from '@user/domain/interface/user.repository.interface'
import { IPASSWORD_HASHER } from '@common/constants/provider.constant'
import { IPasswordHasher } from '@common/interfaces/IPasswordHasher'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(IPASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject('IUserRepository')
    private readonly UserRepository: IUserRepository,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    })
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    console.log('accessToken', accessToken)
    console.log('profile', profile)
    const { id, displayName, emails } = profile

    const password = id
    const email = emails[0].value
    const hashedPassword = await this.passwordHasher.hashPassword(password)

    const user: User = await this.UserRepository.findByEmailOrSave(
      email,
      displayName,
      hashedPassword,
    )
    return user
  }
}
