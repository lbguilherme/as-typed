# `as-typed`

Type magic to convert a JSON Schema literal into the proper TypeScript type representation, all without additional build steps. This module has no runtime functionality by itself. It exposes a single `AsTyped` type which takes a valid JSON Schema and outputs the equivalent type for it. With this you can get type safety at runtime and validate your values at runtime writing types just once. Great for JSON integrations and data serialization.

This is forked from https://github.com/wix-incubator/as-typed fixing many bugs, modernizing and introducing support for more types thanks to newer TypeScript features.

## Install

```
npm install --save-dev as-typed
```

## Usage

```typescript
import { AsTyped } from "as-typed";

const schema = {
  title: "Example Schema",
  type: "object",
  required: ["firstName", "age", "hairColor"],
  properties: {
    firstName: {
      type: "string",
    },
    lastName: {
      type: "string",
    },
    age: {
      type: "integer",
      minimum: 0,
    },
    hairColor: {
      enum: ["black", "brown", "blue"],
      type: "string",
    },
  },
} as const; // <<< "as const" is important to preserve literal type

type SchemaT = AsTyped<typeof schema>;
/*
  type SchemaT = {
    firstName: string;
    age: number;
    hairColor: "black" | "brown" | "blue";
    lastName?: string | undefined;
  };
*/
```

### Primitive types

- `AsTyped<{type: "string"}>` === `string`
- `AsTyped<{type: "number"}>` === `number`
- `AsTyped<{type: "integer"}>` === `number`
- `AsTyped<{type: "boolean"}>` === `boolean`
- `AsTyped<{type: "null"}>` === `null`
- `AsTyped<{type: "undefined"}>` === `undefined`

#### Limitations

- Patterns are not supported.
  There is no regex validation in typescript
  [Typescript issue 6579](https://github.com/Microsoft/TypeScript/issues/41160)

- Value validation (min, max etc) is not supported
  Typescript is not meant for value checking (at least currently).

### Defined objects

- `AsTyped<{type: "object", properties: {foo: {type: "number"}}>` === `{foo?: number}`

#### with required properties

- `AsTyped<{type: "object", properties: {foo: {type: "number"}, bar: {type: "string}, required: ["foo"]}>` === `{foo: number, bar?: string}`

#### objects with a specific value type

`AsTyped<{type: "array", items: [{type: "number"}, {type: "string"}], additionalItems: {type: "boolean"}}>` === `[number, string, ...boolean[]]`

### Recursive objects and arrays

- `AsTyped<{type: "array", items: {type: "array", items: {type: "string"}}}>` === `string[][]`
- `AsTyped<{type: "object", properties: {arr: {type: "array", items: {type: "object", additionalProperties: {type: "string"}}}}}` === `{arr?: {[name: string]: string}[]}`

### Simple array

- `AsTyped<{type: "array", items: {type: "string"}}>` === `string[]`

### Tuple

- `AsTyped<{type: "array", items: [{type: "string"}, {type: "number"}]}>` === `[string, number]`

### Tuple with additional items

- `AsTyped<{type: "array", items: [{type: "string"}, {type: "number"}], additionalItems: {type: "string"}}}>` === `[string, number, ...string[]]`

### Recursive reference by $id

#### Simple references:

- `AsTyped<{definitions: {foo: {$id: "foo", type: "number"}}, $ref: "foo"}>` === `number`

#### Deep references:

- `AsTyped<{definitions: {str1: {$id: "str1", $ref: "str2"}, str2: {$id: "str2", type: "string"}}, $ref: "str1"}>` === `string`

#### Path references:

- `AsTyped<{definitions: {foo: {type: "number"}}, $ref: "#/definitions/foo"}>` === `number`

### not

`Not` works mainly on primitive types, e.g. `AsTyped<{not: {type: "string"}}>` will resolve to `number | object | any[] | boolean | null | undefined`

### oneOf

- `AsTyped<{oneOf: [{type: "string"}, {type: "number"}]}>` === `string | number`

Currently doesn"t work as expected, and resolves the same as anyOf. See [Typescript issue 20863](https://github.com/Microsoft/TypeScript/issues/20863)

### allOf

- `AsTyped<{allOf: [{type: "object", properties: {a: {type: "number"}}}, {type: "object", properties: {b: {type: "string"}}}]}>` === `{a?: number, b?: string}`

### anyOf

- `AsTyped<{allOf: [{type: "object", properties: {a: {type: "number"}}}, {type: "object", properties: {b: {type: "string"}}, required: ["b"]}]}>` === `{a?: number, b: string} | {a?: number} | {b: string}`

### If/Then/Else

`If/Then/Else` acts exactly like `{oneOf: [{allOf: [If, Then]}, Else]}`. It's strange to have this sugar in the schema which doesn't reduce the verbosity.
Currently doesn't work as expected, for the same reasons as oneOf. Resolves to `(If & Then) | Else`, which is not an accurate translation. See [Typescript issue 20863](https://github.com/Microsoft/TypeScript/issues/20863)
