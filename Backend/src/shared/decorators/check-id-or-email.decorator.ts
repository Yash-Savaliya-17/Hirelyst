import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'checkIdOrEmail', async: false })
export class CheckIdOrEmailConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    return object.id !== undefined || object.email !== undefined;
  }

  defaultMessage() {
    return 'Either id or email must be provided';
  }
}

export function CheckIdOrEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'checkIdOrEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: CheckIdOrEmailConstraint,
    });
  };
}
