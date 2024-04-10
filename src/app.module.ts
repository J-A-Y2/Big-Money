import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WinstonModule } from 'nest-winston'
import { getWinstonLogger } from '@common/utils/winston.util'
import { typeORMConfig } from '@common/configs/typeorm.config'
import { AuthModule } from './auth/interface/auth.module'
import { UserModule } from './user/interface/user.module'
import { RequestLoggingMiddleware } from '@common/middlewares/request-logging.middleware'
import { RedisCacheModule } from '@cache/cache.module'
import { ClassificationModule } from '@classification/interface/classification.module'
import { BudgetModule } from '@budget/interface/budget.module'
import { ExpenseModule } from '@expense/interface/expense.module'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        process.env.NODE_ENV === 'production'
          ? '.production.env'
          : '.development.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        await typeORMConfig(configService),
    }),
    WinstonModule.forRoot(getWinstonLogger(process.env.NODE_ENV, 'api')),
    AuthModule,
    UserModule,
    RedisCacheModule,
    ClassificationModule,
    BudgetModule,
    ExpenseModule,
  ],
})
export class AppModule {}
