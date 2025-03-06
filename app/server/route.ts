import { FileSystem, HttpServerRequest, Multipart, Path } from "@effect/platform"
import { Effect, ManagedRuntime, Schema } from "effect"
import type { ParseError } from "effect/Cron"
import type { CreateServerLoaderArgs } from "react-router/route-module"

export function route<R, S extends Route.State>(
  runtime: ManagedRuntime.ManagedRuntime<R | FileSystem.FileSystem | Path.Path, never>,
  state: S = {} as S
): Route<R, S> {
  const handle: Route.Handle<S, R> = (fn) => async (args) => {
    const headers = state.headers ? HttpServerRequest.schemaHeaders(state.headers) : Effect.succeed(undefined)

    const params = state.params ? Schema.decode(state.params)(args.params) : Effect.succeed(args.params)

    const output = <A>(a: A): Effect.Effect<Route.EncodedOutput<A, S>, ParseError, R> =>
      state.output ? Schema.encode(state.output)(a) : (Effect.succeed(a) as any)

    const parse = Effect.all({ headers, params })

    const res = await parse.pipe(
      Effect.flatMap((ctx) => fn(ctx as Route.ParsedRequest<S>)),
      Effect.flatMap(output),
      Effect.provideService(HttpServerRequest.HttpServerRequest, HttpServerRequest.fromWeb(args.request)),
      runtime.runPromise
    )

    return res
  }

  return {
    headers: (headers) => route(runtime, { ...state, headers }),
    formData: (formData) => route(runtime, { ...state, formData }),
    params: (params) => route(runtime, { ...state, params }),
    cookies: (cookies) => route(runtime, { ...state, cookies }),
    output: (output) => route(runtime, { ...state, output }),
    json: (json) => route(runtime, { ...state, json }),
    handle
  } as Route<R, S>
}

export type Route<R, State extends Route.State = Route.State> = Omit<
  {
    params: Route.Params<State, R>
    headers: Route.Headers<State, R>
    cookies: Route.Cookies<State, R>
    formData: Route.FormData<State, R>
    json: Route.Json<State, R>
    output: Route.Output<State, R>
    handle: Route.Handle<State, R>
  },
  Route.KeysToOmit<State>
>

export namespace Route {
  export type BodyKeys = "formData" | "json"

  export type KeysToOmit<S extends State> =
    | (Schema.Schema.Type<S["headers"]> extends undefined ? never : "headers")
    | (Schema.Schema.Type<S["cookies"]> extends undefined ? never : "cookies")
    | (Schema.Schema.Type<S["params"]> extends undefined ? never : "params")
    | (Schema.Schema.Type<S["output"]> extends undefined ? never : "output")
    | (Schema.Schema.Type<S["body"]> extends undefined ? never : BodyKeys)

  export type State = {
    body?: Schema.Schema.AnyNoContext
    params?: Schema.Schema.AnyNoContext
    cookies?: Schema.Schema.AnyNoContext
    headers?: Schema.Schema.AnyNoContext
    output?: Schema.Schema.AnyNoContext
  }

  export type ParsedRequest<S extends State> = {
    cookies: Schema.Schema.Type<S["cookies"]>
    params: Schema.Schema.Type<S["params"]>
    body: Schema.Schema.Type<S["body"]>
    headers: Schema.Schema.Type<S["headers"]>
  }

  export type Handle<S extends State, R> = <A, E, Args extends CreateServerLoaderArgs<any>>(
    fn: (req: Compute<ParsedRequest<S>>) => Effect.Effect<EncodedInput<A, S>, E, R>
  ) => (args: Args) => Promise<EncodedOutput<A, S>>

  export type EncodedOutput<Fallback, S extends State> =
    Schema.Schema.Type<S["output"]> extends undefined ? Fallback : Schema.Schema.Encoded<S["output"]>

  export type EncodedInput<Fallback, S extends State> =
    Schema.Schema.Type<S["output"]> extends undefined ? Fallback : Schema.Schema.Type<S["output"]>

  export type FormData<S extends State, R> = <A, I extends Partial<Multipart.Persisted>>(
    schema: Schema.Schema<A, I, R>
  ) => Route<R, Assign<S, { body: Schema.Schema<A, I, R> }>>

  export type Json<S extends State, R> = RouteWithSchema<S, R, "body">
  export type Headers<S extends State, R> = RouteWithSchema<S, R, "headers">
  export type Cookies<S extends State, R> = RouteWithSchema<S, R, "cookies">
  export type Params<S extends State, R> = RouteWithSchema<S, R, "params">

  export type Output<S extends State, R> = <A, I>(
    schema: Schema.Schema<A, I, R>
  ) => Route<R, Assign<S, { output: Schema.Schema<A, I, R> }>>

  type RouteWithSchema<S extends State, R, K extends keyof State> = <A, I extends OptionalStringRecord>(
    schema: Schema.Schema<A, I, R>
  ) => Route<R, Assign<S, { [P in K]: Schema.Schema<A, I, R> }>>
}

type Compute<T> = { [K in keyof T]: T[K] } | never
type Assign<A, B> = Compute<Omit<A, keyof B> & B>
type OptionalStringRecord = Readonly<Record<string, string | undefined>>
