import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { jwtConfig } from '@common/configs/jwt.config'
import { UserProvider } from './user.provider'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '@user/domain/entity/user.entity'
import { EmailModule } from '@email/email.module'
import { AuthProvider } from '@auth/interface/auth.provider'
import { AuthModule } from '@auth/interface/auth.module'

@Module({
  imports: [
    EmailModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: jwtConfig(configService).accessTokenSecret,
        signOptions: {
          expiresIn: jwtConfig(configService).accessTokenExpiration,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [...AuthProvider, ...UserProvider],
  exports: [...UserProvider],
})
export class UserModule {}
