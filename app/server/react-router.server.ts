import { FileSystem, Path } from "@effect/platform"
import { Layer, ManagedRuntime } from "effect"
import type { CreateServerActionArgs } from "react-router/route-module"
import { route, type Route } from "./route"

export class ReactRouterServer<R> {
  static make = <R>(layer: Layer.Layer<R | FileSystem.FileSystem>) => {
    const runtime = ManagedRuntime.make(layer.pipe(Layer.provideMerge(Path.layer)))
    return new ReactRouterServer(runtime)
  }

  private constructor(
    private readonly runtime: ManagedRuntime.ManagedRuntime<R | Path.Path | FileSystem.FileSystem, never>
  ) {}

  // TODO: figure out how to pass params
  // TODO: figure out how to remove BodyKeys
  loader = <Args extends CreateServerActionArgs<any>>(): Route<R, {}> => {
    return route(this.runtime, {})
  }

  // TODO: figure out how to pass params
  action = <Args extends CreateServerActionArgs<any>>() => {
    return route(this.runtime, {})
  }
}
