import { ResLoginAppDto } from '@auth/domain/dto/login.app.dto'
import { ReqRegisterAppDto, ReqUpdateUserAppDto } from '../dto/register.app.dto'
import { Request } from 'express'

export interface IUserService {
  register(user: ReqRegisterAppDto): Promise<CreateUser>

  updateUser(userId: string, req: ReqUpdateUserAppDto): Promise<object>

  deleteUser(userId: string): Promise<object>

  verifyEmail(signupVerifyToken: string, req: Request): Promise<ResLoginAppDto>
}
export interface CreateUser {
  message: string
}
