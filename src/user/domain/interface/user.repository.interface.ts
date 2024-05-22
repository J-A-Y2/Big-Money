import { User } from '../entity/user.entity'
import { ReqUpdateUserAppDto } from '../dto/register.app.dto'

export interface IUserRepository {
  createUser(
    email: string,
    password: string,
    name: string,
    nickname: string,
    birthdate: string,
    age: number,
    gender: string,
  ): Promise<User>

  findByEmail(email: string): Promise<User | null>

  findById(id: string): Promise<User | null>

  findPasswordById(id: string): Promise<string>

  findByEmailOrSave(
    email: string,
    name: string,
    password: string,
  ): Promise<User>

  updateUser(id: string, req: ReqUpdateUserAppDto): Promise<User>

  deleteUser(id: string): Promise<User>
}
