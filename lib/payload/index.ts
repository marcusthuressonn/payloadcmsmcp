import { validatePayloadCode } from './validator';
import { queryValidationRules } from './query';
import { executeSqlQuery } from './sql';
import type { FileType } from './types';
export * from './schemas';
export * from './validator';
export * from './query';
export * from './generator';
export * from './scaffolder';

export { validatePayloadCode, queryValidationRules, executeSqlQuery };
export type { FileType };

/**
 * Convenience function to validate Payload CMS code
 * @param code The code to validate
 * @param fileType The type of file to validate
 * @returns A boolean indicating if the code is valid
 */
export function isValidPayloadCode(code: string, fileType: FileType): boolean {
  const result = validatePayloadCode(code, fileType);
  return result.isValid;
} 