import { NestApplication, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe, Logger } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import { HttpExceptionFilter } from './httpException.filter'
import { NestExpressApplication } from '@nestjs/platform-express'
import path from 'path'

declare const module: any

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {})

  app.useGlobalFilters(new HttpExceptionFilter())
  app.enableCors({ origin: true, credentials: true })
  // app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
  //   prefix: '/uploads',
  // })
  app.use(cookieParser())
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      skipMissingProperties: true,
    }),
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle('asset')
    .setDescription('The asset API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('asset', app, document)

  const configService = app.get(ConfigService)
  const port = configService.get('PORT') || 3000
  await app.listen(port)
  Logger.log(`Application running on port ${port}`)

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}

bootstrap()
