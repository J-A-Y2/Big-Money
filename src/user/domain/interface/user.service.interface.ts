import { ResLoginAppDto } from '@auth/domain/dto/login.app.dto'
import { ReqRegisterAppDto, ReqUpdateUserAppDto } from '../dto/register.app.dto'
import { User } from '../entity/user.entity'
import { Request } from 'express'

export interface IUserService {
  register(user: ReqRegisterAppDto): Promise<User>

  updateUser(userId: string, req: ReqUpdateUserAppDto): Promise<object>

  deleteUser(userId: string): Promise<object>

  verifyEmail(signupVerifyToken: string, req: Request): Promise<ResLoginAppDto>
}
