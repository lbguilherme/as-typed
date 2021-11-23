# `as-typed`

![npm badge](https://img.shields.io/npm/v/as-typed)

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
      type: "string"
    },
    lastName: {
      type: "string"
    },
    age: {
      type: "integer",
      minimum: 0
    },
    hairColor: {
      enum: ["black", "brown", "blue"],
      type: "string"
    }
  }
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

### Primitive and literal types

```typescript
type Str = AsTyped<{ type: "string" }>; // string
type Num = AsTyped<{ type: "number" }>; // number
type Int = AsTyped<{ type: "integer" }>; // number
type Bool = AsTyped<{ type: "boolean" }>; // boolean
type Null = AsTyped<{ type: "null" }>; // null
type Undef = AsTyped<{ type: "undefined" }>; // undefined

type ConstStr = AsTyped<{ type: "string"; const: "Hello" }>; // "Hello"
type ConstNum = AsTyped<{ type: "integer"; const: 4 }>; // 4
type Enum = AsTyped<{
  type: "string";
  enum: ["First", "Second", "Third"];
}>; // "First" | "Second" | "Third"

type Nullable1 = AsTyped<{ type: ["string", "null"] }>; // string | null
type Nullable2 = AsTyped<{ type: "string"; nullable: true }>; // string | null
```

- Patterns are not supported. There is no regex validation in typescript, see [Typescript issue 6579](https://github.com/Microsoft/TypeScript/issues/41160).
- Value validation (min, max etc) is not supported. Typescript is not meant for value checking (at least currently).

### Objects

```typescript
type Obj1 = AsTyped<{
  type: "object";
  properties: {
    foo: { type: "number" };
  };
}>; // { foo?: number }

type Obj2 = AsTyped<{
  type: "object";
  properties: {
    foo: { type: "number" };
    bar: { type: "string" };
  };
  required: ["foo"];
}>; // { foo: number, bar?: string }

type Obj3 = AsTyped<{
  type: "object";
  additionalProperties: { type: "integer" };
}>; // Record<string, number>
```

### Arrays and Tuples

```typescript
type List1 = AsTyped<{
  type: "array";
  items: { type: "string" };
}>; // string[]

type List2 = AsTyped<{
  type: "array";
  items: {
    type: "array";
    items: { type: "string" };
  };
}>; // string[][]

type Tuple1 = AsTyped<{
  type: "array";
  items: [{ type: "string" }, { type: "number" }];
}>; // [string, number]

type Tuple2 = AsTyped<{
  type: "array";
  items: [{ type: "number" }, { type: "string" }];
  additionalItems: { type: "boolean" };
}>; // [number, string, ...boolean[]]
```

### References by id

```typescript
type ObjFromRefs = AsTyped<{
  definitions: {
    User: {
      $id: "userschemaid";
      type: "object";
      properties: {
        name: { type: "string" };
        age: { type: "integer" };
      };
    };
    UserList: {
      $id: "userlist";
      type: "array";
      items: { $ref: "userschemaid" };
    };
  };
  type: "object";
  required: ["result"];
  properties: { result: { $ref: "userlist" } };
}>; // { result: { name?: string, age?: number }[] }
```

### References by path

```typescript
type ObjFromRefs = AsTyped<{
  definitions: {
    User: {
      type: "object";
      properties: {
        name: { type: "string" };
        age: { type: "integer" };
      };
    };
    UserList: {
      type: "array";
      items: { $ref: "#/definitions/User" };
    };
  };
  type: "object";
  required: ["result"];
  properties: { result: { $ref: "#/definitions/UserList" } };
}>; // { result: { name?: string, age?: number }[] }
```

### Advanced Types

```typescript
type Union1 = AsTyped<{ anyOf: [{ type: "string" }, { type: "number" }] }>; // string | number

type Union2 = AsTyped<{ oneOf: [{ type: "string" }, { type: "number" }] }>; // string | number

type Intersection1 = AsTyped<{
  allOf: [
    { type: "object"; properties: { a: { type: "number" } } },
    { type: "object"; properties: { b: { type: "string" } } }
  ];
}>; // { a?: number, b?: string }

type Intersection2 = AsTyped<{
  allOf: [
    { type: "object"; properties: { a: { type: "number" } } },
    {
      oneOf: [
        { type: "object"; properties: { b: { type: "string" } } },
        { type: "object"; properties: { b: { type: "boolean" } } }
      ];
    }
  ];
}>; // { a?: number; b?: string } | { a?: number; b?: boolean }

type Not = AsTyped<{ not: { type: "string" } }>; // number | object | any[] | boolean | null | undefined
```

- `oneOf` Currently doesn"t work as expected, and resolves the same as anyOf. See [Typescript issue 20863](https://github.com/Microsoft/TypeScript/issues/20863).
- `if` / `then` / `else` acts exactly like `{oneOf: [{allOf: [If, Then]}, Else]}`. Currently doesn't work as expected, for the same reasons as oneOf. Resolves to `(If & Then) | Else`, which is not an accurate translation.
