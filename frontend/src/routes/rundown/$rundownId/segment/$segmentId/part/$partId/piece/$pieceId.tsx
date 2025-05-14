import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/rundown/$rundownId/segment/$segmentId/part/$partId/piece/$pieceId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello
      "/rundown/$rundownId/segment/$segmentId/part/$partId/piece/$pieceId"!
    </div>
  )
}
