import { Repository } from 'typeorm'

export type MockRepository<T = any> = Partial<
  Record<keyof Repository<T> | string, jest.Mock>
>

export class MockRepositoryFactory {
  static getMockRepository<T>(
    type: new (...args: any[]) => T,
  ): MockRepository<T> {
    const mockRepository: MockRepository<T> = {}

    Object.getOwnPropertyNames(Repository.prototype)
      .filter((key: string) => key !== 'constructor')
      .forEach((key: string) => {
        mockRepository[key] = jest.fn()
      })

    Object.getOwnPropertyNames(type.prototype)
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
