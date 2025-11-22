import { FieldType } from './field-types.enum';

/**
 * Options for field validation
 */
export interface FieldValidationOptions {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
  enumClass?: any;
  customMessage?: string;
  transform?: (value: any) => any;
}

/**
 * Field definition for DTO building
 */
export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  validation?: FieldValidationOptions;
  description?: string;
}
