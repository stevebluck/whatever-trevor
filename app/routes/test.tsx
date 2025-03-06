import type { Route } from "./+types/test"
import { Effect, Schema } from "effect"
import { ReactRouterServer } from "~/server/react-router.server"
import { NodeFileSystem } from "@effect/platform-node"

const server = ReactRouterServer.make(NodeFileSystem.layer)

export const loader = server
  .loader<Route.LoaderArgs>()
  .params(Schema.Struct({ id: Schema.NumberFromString }))
  .headers(Schema.Struct({ age: Schema.optional(Schema.NumberFromString) }))
  .cookies(Schema.Struct({ steve: Schema.optional(Schema.String) }))
  .output(Schema.Struct({ test: Schema.NumberFromString }))
  .handle((ctx) => {
    return Effect.succeed({ test: 1, ctx: { ...ctx } })
  })

export function meta({}: Route.MetaArgs) {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }]
}

export default function Home(props: Route.ComponentProps) {
  return (
    <div>
      <h1>Home</h1>
      <pre>{JSON.stringify(props.loaderData, null, 2)}</pre>
    </div>
  )
}
