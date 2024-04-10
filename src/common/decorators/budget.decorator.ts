import {
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
} from 'class-validator'

export function IsClassificationId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isClassificationId',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, ValidationArguments) {
          // 모든 키가 1~18 사이인지 확인합니다.
          return Object.keys(value).every(
            (key) => 1 <= Number(key) && Number(key) <= 18,
          )
        },
      },
    })
  }
}

export function IsInteger(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isInterger',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const values = Object.values(value)
          const isInvalid = values.some(
            (val) =>
              typeof val !== 'number' || !Number.isInteger(val) || val < 0,
          )
          return !isInvalid
        },
      },
    })
  }
}
