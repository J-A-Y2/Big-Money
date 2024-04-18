import { Injectable } from '@nestjs/common'
import { IUserRepository } from '@user/domain/interface/user.repository.interface'
import { User } from '../domain/entity/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { plainToClass } from 'class-transformer'
import { ReqUpdateUserAppDto } from '@user/domain/dto/register.app.dto'

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(
    email: string,
    password: string,
    name: string,
    nickname: string,
    birthdate: Date,
    age: number,
    gender: string,
  ): Promise<User> {
    const newUser = await this.userRepository.save({
      email,
      password,
      name,
      nickname,
      birthdate,
      age,
      gender,
    })
    return plainToClass(User, newUser)
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } })
    return plainToClass(User, user)
  }

  async findById(id: string): Promise<User> {
    if (!id) {
      throw new Error('Invalid id: id cannot be undefined')
    }

    const user = await this.userRepository.findOne({ where: { id } })
    return plainToClass(User, user)
  }

  async findPasswordById(id: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['password'],
    })
    return user.password
  }

  async findByEmailOrSave(
    email: string,
    username: string,
    providerId: string,
  ): Promise<User> {
    const user = await this.userRepository.findOneBy({ email })
    if (user) {
      return user
    }

    const newUser = await this.userRepository.save({
      email,
      username,
      providerId,
    })

    return newUser
  }

  async updateUser(id: string, req: ReqUpdateUserAppDto): Promise<User> {
    const updatedUser = await this.userRepository.save({ id, ...req })
    return updatedUser
  }

  async deleteUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } })
    await this.userRepository.softDelete(id)
    return user
  }
}
