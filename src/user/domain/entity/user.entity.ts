import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm'
import { Exclude, Expose } from 'class-transformer'
import { Expense } from '@expense/infra/db/expense.entity'
import { ApiProperty } from '@nestjs/swagger'

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string

  @ApiProperty({
    example: 'test@test.com',
    description: '이메일',
    required: true,
  })
  @Column({ unique: true })
  @Expose()
  email: string

  @ApiProperty({
    example: 'Password1234!',
    description: '비밀번호',
    required: true,
  })
  @Column({ nullable: true })
  @Exclude()
  password: string

  @ApiProperty({
    example: '홍길동',
    description: '이름',
    required: true,
  })
  @Column({ nullable: false })
  @Expose()
  name: string

  @ApiProperty({
    example: '부자부자',
    description: '닉네임',
    required: true,
  })
  @Column({ unique: true, nullable: true })
  @Expose()
  nickname: string

  @ApiProperty({
    example: '1997-01-01',
    description: '생년월일',
    required: true,
  })
  @Column({ nullable: true })
  @Expose()
  birthdate: string

  @ApiProperty({
    example: '26',
    description: '나이',
    required: true,
  })
  @Column({ nullable: true })
  @Expose()
  age: number

  @ApiProperty({
    example: '남',
    description: '성별',
    required: true,
  })
  @Column({ nullable: true })
  @Expose()
  gender: string

  @CreateDateColumn()
  @Expose()
  createdAt: Date

  @UpdateDateColumn()
  @Expose()
  updatedAt: Date

  @DeleteDateColumn()
  @Expose()
  deleteAt: Date | null

  // @Column({ nullable: false, type: 'varchar', default: '' })
  // @Expose()
  // discordUrl: string

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[]
}
