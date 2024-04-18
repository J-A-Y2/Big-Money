import { Inject, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20'
import { User } from '@user/domain/entity/user.entity'
import { IUserRepository } from '@user/domain/interface/user.repository.interface'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
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
    const { id, name, emails } = profile

    const providerId = id
    const email = emails[0].value

    const user: User = await this.UserRepository.findByEmailOrSave(
      email,
      name.familyName + name.givenName,
      providerId,
    )
    return user
  }
}
