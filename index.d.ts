declare namespace AsTypedInternal {
  type ConstSchema<ConstType> = {
    const?: ConstType;
    enum?: ConstType[];
  } & (ConstType extends number
    ? { type: "number" | "integer" }
    : ConstType extends string
    ? { type: "string" }
    : ConstType extends boolean
    ? { type: "boolean" }
    : never);

  interface TupleSchema<
    TupleAsArray extends any[],
    AdditionalItemsSchema = null
  > {
    type: "array";
    items: TupleAsArray;
    additionalItems?: AdditionalItemsSchema;
  }

  type ResolveObjectRequiredProps<Props, RequiredPropNames> = [
    RequiredPropNames
  ] extends [keyof Props]
    ? {
        [name in RequiredPropNames]: Resolve<Props[name]>;
      }
    : unknown;

  type ResolveObjectOptionalProps<Props, RequiredPropNames> = Props extends null
    ? unknown
    : unknown extends Props
    ? unknown
    : [RequiredPropNames] extends [keyof Props]
    ? [keyof Props] extends [RequiredPropNames]
      ? unknown
      : {
          [K in Exclude<keyof Props, RequiredPropNames>]?: Resolve<Props[K]>;
        }
    : {
        [K in keyof Props]?: Resolve<Props[K]>;
      };

  type ResolveObjectAdditionalProps<AdditionalProperties> =
    unknown extends AdditionalProperties
      ? unknown
      : AdditionalProperties extends false | undefined
      ? unknown
      : AdditionalProperties extends true
      ? { [key: string]: unknown }
      : { [key: string]: Resolve<AdditionalProperties> };

  type ResolveObject<Props, RequiredPropNames, AdditionalProperties> =
    ResolveObjectRequiredProps<Props, RequiredPropNames> &
      ResolveObjectOptionalProps<Props, RequiredPropNames> &
      ResolveObjectAdditionalProps<AdditionalProperties>;

  type AsTypedTupleSchema<Tuple extends unknown[]> = Tuple extends []
    ? []
    : Tuple extends [infer A, ...infer Rest]
    ? [Resolve<A>, ...AsTypedTupleSchema<Rest>]
    : never;

  type AsTypedTupleSchemaWithAdditional<
    Tuple extends unknown[],
    Additional
  > = unknown extends Additional
    ? AsTypedTupleSchema<Tuple>
    : [...AsTypedTupleSchema<Tuple>, ...Array<Resolve<Additional>>];

  type ResolveNot<ValueType> =
    // TODO: allow Not() for array/object types of specific schemas. Not easy.
    | object
    | any[]
    | (ValueType extends { type: "null" } ? never : null)
    | (ValueType extends { type: "number" | "integer" } ? never : number)
    | (ValueType extends { type: "string" } ? never : string)
    | (ValueType extends { type: "boolean" } ? never : boolean);

  type Resolve<SchemaType> = SchemaType extends {
    nullable: true;
  }
    ? Resolve<Omit<SchemaType, "nullable">> | null
    : SchemaType extends { type: "null" }
    ? null
    : SchemaType extends ConstSchema<infer Value>
    ? Value
    : SchemaType extends { type: "string" }
    ? string
    : SchemaType extends { type: "boolean" }
    ? boolean
    : SchemaType extends { type: "number" | "integer" }
    ? number
    : SchemaType extends TupleSchema<infer TupleType, infer Additional>
    ? Additional extends null
      ? AsTypedTupleSchema<TupleType>
      : AsTypedTupleSchemaWithAdditional<TupleType, Additional>
    : SchemaType extends { not: infer T }
    ? ResolveNot<T>
    : SchemaType extends {
        type: "object";
        required?: infer Required;
        properties?: infer Props;
        additionalProperties?: infer AdditionalProperties;
      }
    ? ResolveObject<
        Props,
        Required extends undefined
          ? unknown
          : Required extends string[]
          ? string extends Required[number]
            ? unknown
            : Required[number]
          : unknown,
        AdditionalProperties
      >
    : SchemaType extends { type: "array"; items: infer ValueType }
    ? Array<Resolve<ValueType>>
    : SchemaType extends {
        type: [infer Type];
      }
    ? Resolve<Omit<SchemaType, "type"> & { type: Type }>
    : SchemaType extends {
        type: [infer Type, ...infer Rest];
      }
    ?
        | Resolve<Omit<SchemaType, "type"> & { type: Type }>
        | Resolve<Omit<SchemaType, "type"> & { type: Rest }>
    : SchemaType extends { oneOf: Array<infer Inner> }
    ? Resolve<Inner>
    : SchemaType extends { anyOf: Array<infer Inner> }
    ? Resolve<Inner>
    : SchemaType extends { allOf: [...infer Inner] }
    ? ResolveAllOf<Inner>
    : SchemaType extends { if: infer If; then: infer Then; else?: infer Else }
    ? (Resolve<If> & Resolve<Then>) | Resolve<Else>
    : never;

  type ResolveAllOf<Tuple> = Tuple extends []
    ? unknown
    : Tuple extends [infer Head, ...infer Tail]
    ? Resolve<Head> & ResolveAllOf<Tail>
    : unknown;

  type ResolvePath<Schema, Path> =
    Path extends `${infer Prop}/${infer PathRest}`
      ? Prop extends keyof Schema
        ? ResolvePath<Schema[Prop], PathRest>
        : never
      : Path extends keyof Schema
      ? Schema[Path]
      : never;

  type LocateId<Candidates, Id> = Candidates extends { $id: Id }
    ? Candidates
    : never;

  type ResolveRefs<RootSchema, SchemaToResolve> = SchemaToResolve extends {
    $ref: infer RefId;
  }
    ? RefId extends `#/${infer Path}`
      ? ResolveRefs<RootSchema, ResolvePath<RootSchema, Path>>
      : RootSchema extends { definitions: infer Definitions }
      ? ResolveRefs<RootSchema, LocateId<Definitions[keyof Definitions], RefId>>
      : never
    : SchemaToResolve extends object
    ? {
        [P in keyof SchemaToResolve]: ResolveRefs<
          RootSchema,
          SchemaToResolve[P]
        >;
      }
    : SchemaToResolve extends [...infer Tuple]
    ? [...ResolveRefs<RootSchema, Tuple>]
    : SchemaToResolve;

  type ResolveRootSchema<RootSchema> = Resolve<
    ResolveRefs<RootSchema, RootSchema>
  >;

  type DeepUnReadonly<T> = T extends object
    ? {
        -readonly [P in keyof T]: DeepUnReadonly<T[P]>;
      }
    : T;

  type ExpandRecursively<T> = T extends object
    ? T extends infer O
      ? { [K in keyof O]: ExpandRecursively<O[K]> }
      : never
    : T;
}

export type AsTyped<Schema> = AsTypedInternal.ExpandRecursively<
  AsTypedInternal.ResolveRootSchema<AsTypedInternal.DeepUnReadonly<Schema>>
>;
