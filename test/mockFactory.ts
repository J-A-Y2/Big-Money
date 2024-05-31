import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

export type MockRepository<T = any> = Partial<Record<keyof T, jest.Mock>>

export class MockRepositoryFactory {
  static getMockRepository<T>(
    type: new (...args: any[]) => T,
  ): MockRepository<T> {
    const mockRepository: MockRepository<T> = {}
    console.log('type', type)

    // 모듈 경로를 올바르게 가져옴
    const repositoryToken = getRepositoryToken(type) as string
    console.log('repositoryToken', repositoryToken)
    const repository = require(repositoryToken)

    console.log('repository', repository)

    Object.getOwnPropertyNames(repository.prototype)
      .filter((key: string) => key !== 'constructor')
      .forEach((key: string) => {
        mockRepository[key] = jest.fn()
      })

    return mockRepository
  }
}
export type MockService<T = any> = Partial<Record<keyof T, jest.Mock>>

export class MockServiceFactory {
  static getMockService<T>(type: new (...args: any[]) => T): MockService<T> {
    const mockService: MockService<T> = {}

    Object.getOwnPropertyNames(type.prototype)
      .filter((key: string) => key !== 'constructor')
      .forEach((key: string) => {
        mockService[key] = jest.fn()
      })

    return mockService
  }
}
