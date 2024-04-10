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

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string

  @Column({ length: 15 })
  @Expose()
  email: string

  @Column()
  @Exclude()
  password: string

  @Column({ nullable: false })
  @Expose()
  name: string

  @Column()
  @Expose()
  nickname: string

  @Column()
  @Expose()
  birthdate: Date

  @Column()
  @Expose()
  age: number

  @Column()
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
