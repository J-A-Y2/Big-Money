import { Budget } from '@budget/domain/budget.entity'
import { Classification } from '@classification/domain/classification.entity'
import { Expense } from '@expense/infra/db/expense.entity'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { User } from '@user/domain/entity/user.entity'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

export const typeORMConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOSTNAME') || 'localhost',
    port: parseInt(configService.get<string>('DB_PORT')) || 5432,
    username: configService.get<string>('DB_USERNAME') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || '0000',
    database: configService.get<string>('DB_DATABASE') || 'postgres',
    entities: [User, Expense, Budget, Classification], // 상대경로 지정 확실히 하기!
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE') || false,
    namingStrategy: new SnakeNamingStrategy(),
    logging: false, // 이 부분을 추가하여 디버그 로깅을 활성화합니다.
    // logger: 'debug',
  }
}
