declare namespace AsTypedInternal {
  type SchemaBase = {
    $id?: string;
  } & (
    | {
        type?: string | string[];
        title?: string;
        description?: string;
        nullable?: boolean;
        default?: any;
        examples?: any[];
      }
    | { $ref: string }
    | { oneOf: SchemaBase[] }
    | { allOf: SchemaBase[] }
    | {
        if: SchemaBase;
        then: SchemaBase;
        else?: SchemaBase;
      }
  );

  type SchemaDeclaration<Type> = SchemaBase & {
    type: Type;
  };

  interface RefSchema<RefId extends string> {
    $ref: RefId;
  }

  type EnumSchema<BaseType, EnumType> = BaseType & { enum: EnumType[] };

  type UnionToIntersection<U> = (
    U extends any ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never;

  type NumberSchema = SchemaDeclaration<"number" | "integer"> & {
    multipleOf?: number;
    minimun?: number;
    exclusiveMinimum?: number;
    maximum?: number;
    exclusiveMaximum?: number;
  };

  type StringSchema = SchemaDeclaration<"string"> & {
    pattern?: RegExp;
    maxLength?: number;
    minLength?: number;
  };

  type ConstSchema<ConstType> = {
    const?: ConstType;
    enum?: ConstType[];
  } & (ConstType extends number
    ? NumberSchema
    : ConstType extends string
    ? StringSchema
    : ConstType extends boolean
    ? BoolSchema
    : never);

  type BoolSchema = SchemaDeclaration<"boolean">;

  type ObjectSchema<
    Props,
    ReqProps extends string[],
    AdditionalProps extends SchemaBase | boolean = false
  > = SchemaDeclaration<"object"> & {
    required?: ReqProps;
    properties?: Props;
    additionalProperties?: AdditionalProps;
    maxProperties?: number;
    minProperties?: number;
    patternProperties?: { [name: string]: SchemaBase };
    dependencies?: { [name: string]: SchemaBase | SchemaBase[] };
    propertyNames?: StringSchema;
  };

  type CombinerSchema<ValueType extends SchemaBase, Operator extends string> = {
    [operator in Operator]: ValueType[];
  };

  type OperatorSchema<ValueType extends SchemaBase, Operator extends string> = {
    [operator in Operator]: ValueType;
  };

  type IfThenElseSchema<
    If extends SchemaBase,
    Then extends SchemaBase,
    Else extends SchemaBase
  > = SchemaBase & {
    if: If;
    then: Then;
    else?: Else;
  };

  type AllOf<ValueType extends SchemaBase> = CombinerSchema<ValueType, "allOf">;

  type OneOf<ValueType extends SchemaBase> = CombinerSchema<ValueType, "oneOf">;

  type AnyOf<ValueType extends SchemaBase> = CombinerSchema<ValueType, "anyOf">;

  type Not<ValueType extends SchemaBase> = OperatorSchema<ValueType, "not">;

  type ArraySchemaBase = SchemaDeclaration<"array"> & {
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    contains?: SchemaBase;
  };

  type ArraySchema<ValueSchema> = ArraySchemaBase & {
    items: ValueSchema extends any[] ? never : ValueSchema;
  };

  type TupleSchema<
    TupleAsArray extends any[],
    AdditionalItemsSchema = null
  > = ArraySchemaBase & {
    items: TupleAsArray;
    additionalItems?: AdditionalItemsSchema;
  };

  type ResolveObjectRequiredProps<Props, RequiredPropNames> = [
    RequiredPropNames
  ] extends [keyof Props]
    ? {
        [name in RequiredPropNames]: ResolveRecursive<Props[name]>;
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
          [optKey in Exclude<
            keyof Props,
            RequiredPropNames
          >]?: ResolveRecursive<Props[optKey]>;
        }
    : {
        [optKey in keyof Props]?: ResolveRecursive<Props[optKey]>;
      };

  type ResolveObjectAdditionalProps<
    AdditionalPropsSchema
  > = AdditionalPropsSchema extends false
    ? unknown
    : AdditionalPropsSchema extends true
    ? { [key: string]: unknown }
    : { [key: string]: ResolveRecursive<AdditionalPropsSchema> };

  type ResolveObject<
    Props,
    RequiredPropNames,
    SchemaForAdditionalProperties
  > = ResolveObjectRequiredProps<Props, RequiredPropNames> &
    ResolveObjectOptionalProps<Props, RequiredPropNames> &
    ResolveObjectAdditionalProps<SchemaForAdditionalProperties>;

  type ResolveArray<ValueType> = Array<ResolveRecursive<ValueType>>;

  type AsTypedTupleSchema<Tuple extends unknown[]> = Tuple extends []
    ? []
    : Tuple extends [infer A, ...infer Rest]
    ? [ResolveRecursive<A>, ...AsTypedTupleSchema<Rest>]
    : never;

  type AsTypedTupleSchemaWithAdditional<
    Tuple extends unknown[],
    Additional
  > = unknown extends Additional
    ? AsTypedTupleSchema<Tuple>
    : [...AsTypedTupleSchema<Tuple>, ...Array<ResolveRecursive<Additional>>];

  type ResolveNot<ValueType> =
    // TODO: allow Not() for array/object types of specific schemas. Not easy.
    | object
    | any[]
    | (ValueType extends SchemaDeclaration<"null"> ? never : null)
    | (ValueType extends NumberSchema ? never : number)
    | (ValueType extends StringSchema ? never : string)
    | (ValueType extends BoolSchema ? never : boolean);

  type ResolveRecursive<SchemaType> = SchemaType extends {
    nullable: true;
  }
    ? ResolveRecursive<Omit<SchemaType, "nullable">> | null
    : SchemaType extends SchemaDeclaration<"null">
    ? null
    : SchemaType extends ConstSchema<infer Value>
    ? Value
    : SchemaType extends SchemaDeclaration<"string">
    ? string
    : SchemaType extends SchemaDeclaration<"boolean">
    ? boolean
    : SchemaType extends SchemaDeclaration<"number" | "integer">
    ? number
    : SchemaType extends TupleSchema<infer TupleType, infer Additional>
    ? Additional extends null
      ? AsTypedTupleSchema<TupleType>
      : AsTypedTupleSchemaWithAdditional<TupleType, Additional>
    : SchemaType extends Not<infer T>
    ? ResolveNot<T>
    : SchemaType extends ObjectSchema<
        infer Props,
        infer Required,
        infer Additional
      >
    ? ResolveObject<
        Props,
        string extends Required[number] ? unknown : Required[number],
        Additional
      >
    : SchemaType extends ArraySchema<infer ValueType>
    ? ResolveArray<ValueType>
    : SchemaType extends {
        type: [infer Type];
      }
    ? ResolveRecursive<Omit<SchemaType, "type"> & { type: Type }>
    : SchemaType extends {
        type: [infer Type, ...infer Rest];
      }
    ?
        | ResolveRecursive<Omit<SchemaType, "type"> & { type: Type }>
        | ResolveRecursive<Omit<SchemaType, "type"> & { type: Rest }>
    : SchemaType extends OneOf<infer Inner>
    ? ResolveRecursive<Inner>
    : SchemaType extends AnyOf<infer Inner>
    ? ResolveRecursive<Inner>
    : SchemaType extends AllOf<infer Inner>
    ? ResolveRecursive<UnionToIntersection<Inner>>
    : SchemaType extends IfThenElseSchema<infer If, infer Then, infer Else>
    ? ResolveRecursive<(If & Then) | Else>
    : SchemaType;

  type MapPropsToRefs<RootSchema, Props> = {
    [name in keyof Props]: ResolveRefs<RootSchema, Props[name]>;
  };

  type ResolveIfThenElseRefs<
    RootSchema,
    If extends SchemaBase,
    Then extends SchemaBase,
    Else extends SchemaBase
  > = SchemaBase & {
    if: ResolveRefs<RootSchema, If>;
    then: ResolveRefs<RootSchema, Then>;
    else: ResolveRefs<RootSchema, Else>;
  };

  type ResolveArrayRefs<
    RootSchema,
    ValueType extends SchemaBase
  > = SchemaDeclaration<"array"> & {
    items: ResolveRefs<RootSchema, ValueType>;
  };

  type ResolveTupleRefs<
    RootSchema,
    Tuple extends SchemaBase[],
    Additional extends SchemaBase
  > = SchemaDeclaration<"array"> & {
    items: ResolveRefs<RootSchema, Tuple>;
    additionalItems: ResolveRefs<RootSchema, Additional>;
  };

  type ResolveCombinerRefs<
    RootSchema,
    ValueType extends SchemaBase,
    Operator extends string
  > = {
    [name in Operator]: Array<ResolveRefs<RootSchema, ValueType>>;
  };

  type ResolveOperatorRefs<
    RootSchema,
    ValueType extends SchemaBase,
    Operator extends string
  > = { [name in Operator]: ResolveRefs<RootSchema, ValueType> };

  type ResolvePath<
    Schema,
    Path
  > = Path extends `${infer Prop}/${infer PathRest}`
    ? Prop extends keyof Schema
      ? ResolvePath<Schema[Prop], PathRest>
      : never
    : Path extends keyof Schema
    ? Schema[Path]
    : never;

  type LocateId<Candidates, Id extends string> = Candidates extends { $id: Id }
    ? Candidates
    : never;

  type ResolveRefs<
    RootSchema,
    SchemaToResolve
  > = SchemaToResolve extends RefSchema<infer RefId>
    ? RefId extends `#/${infer Path}`
      ? ResolveRefs<RootSchema, ResolvePath<RootSchema, Path>>
      : RootSchema extends { definitions: infer Definitions }
      ? ResolveRefs<RootSchema, LocateId<Definitions[keyof Definitions], RefId>>
      : never
    : SchemaToResolve extends ObjectSchema<infer Props, infer Required>
    ? ObjectSchema<MapPropsToRefs<RootSchema, Props>, Required>
    : SchemaToResolve extends TupleSchema<infer Tuple, infer Additional>
    ? Tuple extends SchemaBase[]
      ? ResolveTupleRefs<RootSchema, Tuple, Additional>
      : never
    : SchemaToResolve extends ArraySchema<infer ValueType>
    ? ResolveArrayRefs<RootSchema, ValueType>
    : SchemaToResolve extends CombinerSchema<infer ValueType, infer Operator>
    ? ResolveCombinerRefs<RootSchema, ValueType, Operator>
    : SchemaToResolve extends OperatorSchema<infer ValueType, infer Operator>
    ? ResolveOperatorRefs<RootSchema, ValueType, Operator>
    : SchemaToResolve extends IfThenElseSchema<infer If, infer Then, infer Else>
    ? ResolveIfThenElseRefs<RootSchema, If, Then, Else>
    : SchemaToResolve;

  type ResolveRootSchema<RootSchema> = ResolveRecursive<
    ResolveRefs<RootSchema, RootSchema>
  >;

  type DeepUnReadonly<T> = T extends object ? DeepUnReadonlyObject<T> : T;
  type DeepUnReadonlyObject<T> = {
    -readonly [P in keyof T]: DeepUnReadonly<T[P]>;
  };

  type ExpandRecursively<T> = T extends object
    ? T extends infer O
      ? { [K in keyof O]: ExpandRecursively<O[K]> }
      : never
    : T;
}

export type AsTyped<Schema> = AsTypedInternal.ExpandRecursively<
  AsTypedInternal.ResolveRootSchema<AsTypedInternal.DeepUnReadonly<Schema>>
>;
