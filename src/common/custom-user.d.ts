import { UserEntity } from '@user/domain/entities/user.entity'

declare global {
  namespace Express {
    interface User extends UserEntity {
      id: string
      accessToken?: string
      refreshToken?: string
    }

    interface Request {
      user?: User | undefined
    }
  }
}
