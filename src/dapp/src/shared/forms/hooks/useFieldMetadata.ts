import type { z } from 'zod'
import { useFormValidator } from '../validated-form/ValidatedForm'

export const useFieldMetaData = (field: string) => {
  const validator = useFormValidator()

  if (validator === undefined) {
    return {
      required: false,
    }
  }

  const fieldSchema = getDeepPropertyOfSchema(validator._def.schema, field.split('.'))
  return {
    required: validator && !fieldSchema.isOptional(),
  }
}

function getDeepPropertyOfSchema(schema: z.ZodTypeAny, path: string[]): z.ZodTypeAny {
  if (path.length === 0) return schema
  const [first, ...rest] = path

  if (!isNaN(Number(first))) {
    // probably array access
    if (isZodArray(schema)) {
      return getDeepPropertyOfSchema(schema._def.type, rest)
    }
  }
  if (!isZodObject(schema)) {
    throw new Error(`Can't access property '${first}' of schema this is not an object`)
  }
  if (first in schema.shape) {
    const firstSchema = schema.shape[first]
    return getDeepPropertyOfSchema(firstSchema, rest)
  }
  throw new Error(`Property '${first}' does not exist on schema: ${Object.keys(schema.shape).join(', ')}`)
}

function isZodObject(schema: z.ZodTypeAny): schema is z.ZodObject<Record<string, z.ZodTypeAny>, any, any> {
  return schema._def.typeName === 'ZodObject'
}

function isZodArray(schema: z.ZodTypeAny): schema is z.ZodArray<z.ZodTypeAny> {
  return schema._def.typeName === 'ZodArray'
}
