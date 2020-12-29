declare namespace AsTypedInternal {
  interface SchemaBase {
    $id?: string;
    $ref?: string;
    type?: string | string[];
    title?: string;
    description?: string;
    nullable?: boolean;
    default?: any;
    examples?: any[];
  }

  interface DefinitionsBase {
    [name: string]: SchemaBase;
  }

  type SchemaWithDefinitions<
    SchemaDefinitions extends DefinitionsBase
  > = SchemaBase & {
    definitions: SchemaDefinitions;
  };

  type TypeName<T> = T extends null
    ? "null"
    : T extends string
    ? "string"
    : T extends any[]
    ? "array"
    : T extends number
    ? "number" | "integer"
    : T extends boolean
    ? "boolean"
    : "object";

  interface WithID {
    $id: string;
  }

  type SchemaDeclaration<Type> = SchemaBase & {
    type: TypeName<Type>;
    $id?: string;
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

  type NumberSchema = SchemaDeclaration<number> & {
    multipleOf?: number;
    minimun?: number;
    exclusiveMinimum?: number;
    maximum?: number;
    exclusiveMaximum?: number;
  };

  type StringSchema = SchemaDeclaration<string> & {
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

  type BoolSchema = SchemaDeclaration<boolean>;

  type NullSchema = SchemaDeclaration<null>;

  type LeafSchema = NumberSchema | StringSchema | BoolSchema | NullSchema;

  type ObjectSchema<
    Props,
    ReqProps extends string[],
    AdditionalProps extends SchemaBase | null = null
  > = SchemaDeclaration<{}> & {
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

  type ArraySchemaBase = SchemaDeclaration<any[]> & {
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
  > = AdditionalPropsSchema extends null
    ? unknown
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
    ? [ResolveRecursiveInternal<A>, ...AsTypedTupleSchema<Rest>]
    : never;

  type AsTypedTupleSchemaWithAdditional<
    Tuple extends unknown[],
    Additional
  > = unknown extends Additional
    ? AsTypedTupleSchema<Tuple>
    : [
        ...AsTypedTupleSchema<Tuple>,
        ...Array<ResolveRecursiveInternal<Additional>>
      ];

  // This is very crude

  type ResolveNot<ValueType> =
    // TODO: allow Not() for array/object types of specific schemas. Not easy.
    | object
    | any[]
    | (ValueType extends NullSchema ? never : null)
    | (ValueType extends NumberSchema ? never : number)
    | (ValueType extends StringSchema ? never : string)
    | (ValueType extends BoolSchema ? never : boolean);

  type ResolveRecursiveInternal<SchemaType> = SchemaType extends {
    nullable: true;
  }
    ? ResolveRecursiveInternal<Omit<SchemaType, "nullable">> | null
    : SchemaType extends SchemaDeclaration<null>
    ? null
    : SchemaType extends ConstSchema<infer Value>
    ? Value
    : SchemaType extends SchemaDeclaration<string>
    ? string
    : SchemaType extends SchemaDeclaration<boolean>
    ? boolean
    : SchemaType extends SchemaDeclaration<number>
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
    ? ResolveRecursiveInternal<Omit<SchemaType, "type"> & { type: Type }>
    : SchemaType extends {
        type: [infer Type, ...infer Rest];
      }
    ?
        | ResolveRecursiveInternal<Omit<SchemaType, "type"> & { type: Type }>
        | ResolveRecursiveInternal<Omit<SchemaType, "type"> & { type: Rest }>
    : never;

  // High order resolution changes the schema before resolving it to typed

  type ResolveHighOrder<
    SchemaToResolve extends SchemaBase
  > = SchemaToResolve extends IfThenElseSchema<infer If, infer Then, infer Else>
    ? (If & Then) | Else
    : SchemaToResolve extends OneOf<infer Inner>
    ? Inner
    : SchemaToResolve extends AllOf<infer Inner>
    ? UnionToIntersection<Inner>
    : SchemaToResolve extends AnyOf<infer Inner>
    ? Inner
    : SchemaToResolve;

  type ResolveRecursive<SchemaType> = ResolveRecursiveInternal<
    ResolveHighOrder<SchemaType>
  >;

  type MapPropsToRefs<
    RootSchema,
    Props,
    Definitions extends DefinitionsBase
  > = Definitions extends { [name: string]: SchemaBase }
    ? {
        [name in keyof Props]: ResolveRefs<
          RootSchema,
          Props[name],
          Definitions
        >;
      }
    : never;

  type ResolveIfThenElseRefs<
    RootSchema,
    If extends SchemaBase,
    Then extends SchemaBase,
    Else extends SchemaBase,
    Definitions extends DefinitionsBase
  > = SchemaBase & {
    if: ResolveRefs<RootSchema, If, Definitions>;
    then: ResolveRefs<RootSchema, Then, Definitions>;
    else: ResolveRefs<RootSchema, Else, Definitions>;
  };

  type ResolveArrayRefs<
    RootSchema,
    ValueType extends SchemaBase,
    Definitions extends DefinitionsBase
  > = SchemaDeclaration<any[]> & {
    items: ResolveRefs<RootSchema, ValueType, Definitions>;
  };

  type ResolveTupleRefs<
    RootSchema,
    Tuple extends SchemaBase[],
    Additional extends SchemaBase,
    Definitions extends DefinitionsBase
  > = SchemaDeclaration<any[]> & {
    items: ResolveRefs<RootSchema, Tuple, Definitions>;
    additionalItems: ResolveRefs<RootSchema, Additional, Definitions>;
  };

  type ResolveCombinerRefs<
    RootSchema,
    ValueType extends SchemaBase,
    Operator extends string,
    Definitions extends DefinitionsBase
  > = {
    [name in Operator]: Array<ResolveRefs<RootSchema, ValueType, Definitions>>;
  };

  type ResolveOperatorRefs<
    RootSchema,
    ValueType extends SchemaBase,
    Operator extends string,
    Definitions extends DefinitionsBase
  > = { [name in Operator]: ResolveRefs<RootSchema, ValueType, Definitions> };

  type ResolveDefinitions<RootSchema, Definitions extends DefinitionsBase> = {
    [DefinitionName in keyof Definitions]: ResolveRefs<
      RootSchema,
      Definitions[DefinitionName],
      Definitions
    >;
  };

  type ExtractDefinitionsById<Definitions extends DefinitionsBase> = {
    [key in Definitions[keyof Definitions]["$id"] &
      string]: Definitions[keyof Definitions];
  };

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

  type ResolveRefs<
    RootSchema,
    SchemaToResolve,
    Definitions extends DefinitionsBase
  > = SchemaToResolve extends RefSchema<infer RefId>
    ? RefId extends `#/${infer Path}`
      ? ResolveRefs<RootSchema, ResolvePath<RootSchema, Path>, Definitions>
      : Definitions[RefId]
    : SchemaToResolve extends ObjectSchema<infer Props, infer Required>
    ? ObjectSchema<MapPropsToRefs<RootSchema, Props, Definitions>, Required>
    : SchemaToResolve extends TupleSchema<infer Tuple, infer Additional>
    ? Tuple extends SchemaBase[]
      ? ResolveTupleRefs<RootSchema, Tuple, Additional, Definitions>
      : never
    : SchemaToResolve extends ArraySchema<infer ValueType>
    ? ResolveArrayRefs<RootSchema, ValueType, Definitions>
    : SchemaToResolve extends CombinerSchema<infer ValueType, infer Operator>
    ? ResolveCombinerRefs<RootSchema, ValueType, Operator, Definitions>
    : SchemaToResolve extends OperatorSchema<infer ValueType, infer Operator>
    ? ResolveOperatorRefs<RootSchema, ValueType, Operator, Definitions>
    : SchemaToResolve extends IfThenElseSchema<infer If, infer Then, infer Else>
    ? ResolveIfThenElseRefs<RootSchema, If, Then, Else, Definitions>
    : SchemaToResolve;

  type ResolveRootSchemaDefinitions<
    Schema
  > = Schema extends SchemaWithDefinitions<infer D>
    ? ResolveDefinitions<Schema, ExtractDefinitionsById<D>>
    : {};

  type ResolveRefsForRootSchema<RootSchema> = ResolveRefs<
    RootSchema,
    RootSchema,
    ResolveRootSchemaDefinitions<RootSchema>
  >;

  type ResolveRootSchema<RootSchema> = ResolveRecursive<
    ResolveRefsForRootSchema<RootSchema>
  >;

  type DeepUnReadonly<T> = T extends
    | string
    | number
    | boolean
    | undefined
    | null
    ? T
    : DeepUnReadonlyObject<T>;
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
