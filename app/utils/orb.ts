/**
 * The orb's geometry: the run of each of its two spinners and the wire outline of each of
 * the mark's two triangles. Nothing here knows the page; the component decides where each
 * result is drawn and in what paint.
 */

export type Point = readonly [number, number]

/** A number to two decimals, as the string an SVG attribute takes. */
const two = (n: number) => String(Math.round(n * 100) / 100)

/** A point to two decimals, for a gradient's axis. */
export const roundPoint = (point: Point): Point => [Number(two(point[0])), Number(two(point[1]))]

// A spinner is one run on its circle, described by where its head stands. An SVG circle's
// path starts at three o'clock and runs clockwise, so the leading end of a run is its far
// end along the path; the dash offset puts that end at the head's angle (the pattern
// position at path distance s is s + offset). The paint's axis is the chord from tail to
// head in the circle's own box (0 to 1), so a gradient laid on it turns with the arc.
export const spinner = (radius: number, run: number, head: number) => {
  const around = 2 * Math.PI * radius
  const headAt = head * Math.PI / 180
  const tailAt = headAt - run / radius
  const wrap = (distance: number) => ((distance % around) + around) % around
  const rim = (angle: number): Point => [0.5 + Math.cos(angle) / 2, 0.5 + Math.sin(angle) / 2]
  return {
    radius,
    dasharray: `${two(run)} ${two(around - run)}`,
    dashoffset: two(wrap(run - headAt * radius)),
    from: rim(tailAt),
    to: rim(headAt),
  }
}

// The served mark draws each triangle as an inset outline (the points below, in the mark's
// own 512 box) plus a 47.14 round-join stroke, so the visible shape is that triangle grown
// outward by half the stroke with a circular arc of that radius at every corner. The wire
// is that shape's outline: each edge moves outward along its normal by the fillet radius,
// and an arc centred on each corner joins the moved edges. The sign of the triangle's
// turning is the SVG sweep flag, so a mirrored triangle sweeps the other way.
export const MARK_FILLET = 47.14 / 2
export const INK_TRIANGLE: readonly Point[] = [[44.84, 256], [383.68, 75.29], [383.68, 436.71]]
export const PALE_TRIANGLE: readonly Point[] = [[467.16, 256], [128.32, 75.29], [128.32, 436.71]]

export function silhouette(points: readonly Point[], fillet: number): string {
  const count = points.length
  const at = (i: number) => points[i % count] as Point
  const centroid = points.reduce<Point>(([x, y], [px, py]) => [x + px / count, y + py / count], [0, 0])
  const normals = points.map((a, i): Point => {
    const b = at(i + 1)
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    const outward: Point = [(b[1] - a[1]) / length, (a[0] - b[0]) / length]
    const midX = (a[0] + b[0]) / 2 - centroid[0]
    const midY = (a[1] + b[1]) / 2 - centroid[1]
    return outward[0] * midX + outward[1] * midY < 0 ? [-outward[0], -outward[1]] : outward
  })
  const turning = points.reduce((sum, a, i) => {
    const b = at(i + 1)
    const c = at(i + 2)
    return sum + Math.sign((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]))
  }, 0)
  const sweep = turning > 0 ? 1 : 0
  const pushed = (p: Point, n: Point) => `${two(p[0] + fillet * n[0])} ${two(p[1] + fillet * n[1])}`
  const start = `M${pushed(at(0), normals[0] as Point)}`
  const edges = points.map((a, i) => {
    const b = at(i + 1)
    const normal = normals[i] as Point
    const next = normals[(i + 1) % count] as Point
    return ` L${pushed(b, normal)} A${two(fillet)} ${two(fillet)} 0 0 ${sweep} ${pushed(b, next)}`
  })
  return `${start}${edges.join('')} Z`
}
