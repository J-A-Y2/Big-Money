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

  private async findOrRestoreUser(userData: Partial<User>): Promise<User> {
    const { email } = userData

    let user = await this.userRepository.findOne({
      where: { email },
      withDeleted: true, // 소프트 삭제된 계정도 검색
    })

    if (user) {
      if (user.deleteAt) {
        // 소프트 삭제된 계정 복구
        user.deleteAt = null
        Object.assign(user, userData) // 새로운 데이터로 업데이트
        const restoredUser = await this.userRepository.save(user)
        return plainToClass(User, restoredUser)
      } else {
        throw new Error('이미 존재하는 이메일 계정입니다.')
      }
    } else {
      const newUser = this.userRepository.create(userData) // 새로운 사용자 생성
      const savedUser = await this.userRepository.save(newUser) // 새 사용자 저장
      return plainToClass(User, savedUser)
    }
  }

  async createUser(
    email: string,
    password: string,
    name: string,
    nickname: string,
    birthdate: Date,
    age: number,
    gender: string,
  ): Promise<User> {
    const userData = {
      email,
      password,
      name,
      nickname,
      birthdate,
      age,
      gender,
    }
    return this.findOrRestoreUser(userData)
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
    name: string,
    password: string,
  ): Promise<User> {
    const userData = { email, name, password }
    return this.findOrRestoreUser(userData)
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
