import { AsTyped } from "./index";
import { _, assert } from "spec.ts";

const x = { type: "number" } as const;

assert(_ as AsTyped<typeof x>, _ as number);

assert(_ as AsTyped<{ type: "number" }>, _ as number);

assert(_ as AsTyped<{ type: "integer" }>, _ as number);

assert(_ as AsTyped<{ type: "string" }>, _ as string);

assert(_ as AsTyped<{ type: ["string", "null"] }>, _ as string | null);

assert(_ as AsTyped<{ type: "string"; nullable: true }>, _ as string | null);

assert(_ as AsTyped<{ type: "string"; nullable: false }>, _ as string);

assert(_ as AsTyped<{ type: "boolean" }>, _ as boolean);

assert(_ as AsTyped<{ type: "null" }>, _ as null);

assert(
  _ as AsTyped<{
    definitions: { num: { $id: "def"; type: "number" } };
    $ref: "def";
  }>,
  _ as number
);

assert(
  _ as AsTyped<{ type: "array"; items: { type: "number" } }>,
  _ as number[]
);

assert(
  _ as AsTyped<{ type: "array"; items: { type: "string" } }>,
  _ as string[]
);

assert(
  _ as AsTyped<{ type: "array"; items: { type: "boolean" } }>,
  _ as boolean[]
);

assert(
  _ as AsTyped<{
    type: "array";
    items: { type: "array"; items: { type: "string" } };
  }>,
  _ as string[][]
);

assert(
  _ as AsTyped<{
    type: "object";
    properties: { b: { type: "boolean" } };
  }>,
  _ as { b?: boolean }
);

assert(
  _ as AsTyped<{
    type: "object";
    required: ["b"];
    properties: { b: { type: "boolean" } };
  }>,
  _ as { b: boolean } & {}
);

assert(
  _ as AsTyped<{
    type: "object";
    properties: { a: { type: "number" }; b: { type: "string" } };
  }>,
  _ as { a?: number; b?: string }
);

assert(
  _ as AsTyped<{
    type: "object";
    required: ["a", "b"];
    properties: { a: { type: "number" }; b: { type: "string" } };
  }>,
  _ as { a: number; b: string }
);

assert(
  _ as AsTyped<{ type: "object"; additionalProperties: { type: "number" } }>,
  _ as { [key: string]: number }
);

assert(
  _ as AsTyped<{
    type: "object";
    properties: { a: { type: "number" }; b: { type: "string" } };
    required: ["a"];
  }>,
  _ as { a: number; b?: string }
);

assert(
  _ as AsTyped<{ not: { type: "number" } }>,
  _ as string | boolean | object | any[] | null
);

assert(
  _ as AsTyped<{ not: { type: "string" } }>,
  _ as number | boolean | object | any[] | null
);

assert(
  _ as AsTyped<{ oneOf: [{ type: "string" }, { type: "number" }] }>,
  _ as string | number
);

assert(
  _ as AsTyped<{
    oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }];
  }>,
  _ as string | number | boolean
);

assert(
  _ as AsTyped<{
    oneOf: [
      { type: "string" },
      { oneOf: [{ type: "number" }, { type: "boolean" }] }
    ];
  }>,
  _ as string | number | boolean
);

assert(
  _ as AsTyped<{
    oneOf: [{ type: "string" }, { type: "array"; items: { type: "string" } }];
  }>,
  _ as string | string[]
);

assert(
  _ as AsTyped<{
    oneOf: [{ type: "string" }, { type: "array"; items: [] }];
  }>,
  _ as string | []
);

assert(
  _ as AsTyped<{
    oneOf: [
      { type: "array"; items: [{ type: "string" }] },
      { type: "array"; items: [] }
    ];
  }>,
  _ as [string] | []
);

assert(
  _ as AsTyped<{
    oneOf: [
      { type: "string" },
      { type: "object"; properties: { a: { type: "number" } } }
    ];
  }>,
  _ as string | { a?: number }
);

assert(
  _ as AsTyped<{
    allOf: [
      { type: "object"; properties: { a: { type: "number" } } },
      { type: "object"; properties: { b: { type: "string" } } }
    ];
  }>,
  _ as { a?: number; b?: string }
);

assert(
  _ as AsTyped<{
    type: "array";
    items: [{ type: "number" }, { type: "string" }];
  }>,
  _ as [number, string]
);

assert(
  _ as AsTyped<{
    type: "array";
    items: [{ type: "number" }, { type: "string" }];
    additionalItems: { type: "string" };
  }>,
  _ as [number, string, ...string[]]
);

assert(
  _ as AsTyped<{
    type: "array";
    items: [{ type: "number" }, { type: "string" }];
    additionalItems: {
      type: "object";
      properties: { bla: { type: "string" } };
    };
  }>,
  _ as [number, string, ...Array<{ bla?: string }>]
);

assert(
  _ as AsTyped<{
    type: "object";
    properties: {
      arr: {
        type: "array";
        items: { type: "object"; additionalProperties: { type: "string" } };
      };
    };
  }>,
  _ as { arr?: Array<{ [name: string]: string }> }
);

assert(
  _ as AsTyped<{
    type: ["object", "boolean", "null"];
    properties: {
      arr: {
        type: "array";
        items: { type: "object"; additionalProperties: { type: "string" } };
      };
    };
  }>,
  _ as { arr?: Array<{ [name: string]: string }> } | boolean | null
);

/*
 * assert(
 *   _ as AsTyped<{
 *     if: { type: "object"; properties: { a: { type: "number" } } };
 *     then: { type: "object"; properties: { b: { type: "string" } } };
 *     else: {
 *       type: "object";
 *       properties: { c: { type: "array"; items: { type: "string" } } };
 *     };
 *   }>,
 *   _ as string
 * );
 */

assert(
  _ as AsTyped<{
    type: "object";
    properties: { a: { type: "string"; const: "123" } };
  }>,
  _ as { a?: "123" }
);

assert(
  _ as AsTyped<{ type: "string"; enum: ["123", "456"] }>,
  _ as "123" | "456"
);

assert(
  _ as AsTyped<{
    definitions: { foo: { $id: "foo"; type: "number" } };
    $ref: "foo";
  }>,
  _ as number
);

assert(
  _ as AsTyped<{
    definitions: {
      str1: { $id: "str1"; $ref: "str2" };
      str2: { $id: "str2"; type: "string" };
    };
    $ref: "str1";
  }>,
  _ as string
);

assert(
  _ as AsTyped<{
    definitions: { foo: { type: "number" } };
    $ref: "#/definitions/foo";
  }>,
  _ as number
);

assert(
  _ as AsTyped<{
    definitions: {
      str1: { $ref: "#/definitions/str2" };
      str2: { type: "string" };
    };
    $ref: "#/definitions/str1";
  }>,
  _ as string
);

assert(
  _ as AsTyped<{
    type: "object";
    properties: { b: { type: "boolean" } };
    additionalProperties: true,
  }>,
  _ as { b?: boolean, [k: string]: unknown }
);