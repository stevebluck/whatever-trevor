import type { Route } from "./+types/home"
import { Effect, Schema } from "effect"
import { ReactRouterServer } from "~/server/react-router.server"
import { NodeFileSystem } from "@effect/platform-node"

const { route } = ReactRouterServer.make(NodeFileSystem.layer)

export const loader = route<Route.LoaderArgs>()
  .headers(Schema.Struct({ age: Schema.optional(Schema.NumberFromString) }))
  // .params(Schema.Struct({ id: Schema.NumberFromString }))
  // .cookies(Schema.Struct({ steve: Schema.String }))
  .output(Schema.Struct({ test: Schema.NumberFromString }))
  .handle((ctx) => {
    return Effect.succeed({ test: 1 })
  })

export function meta({}: Route.MetaArgs) {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }]
}

export default function Home(props: Route.ComponentProps) {
  return (
    <div>
      <h1>Home</h1>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  )
}
