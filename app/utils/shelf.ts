// A single role excludes combinations that two booleans would permit; every table must cover every role.
export type ShelfRole = 'alone' | 'lead' | 'follower'

// Heading padding keeps the band's rule continuous; a column gap would split it.
const WIDE_GRID = `@min-card-wide:grid @min-card-wide:grid-cols-[minmax(0,1fr)_auto]
                   @min-card-wide:items-start`
const WIDE_BAND = `@min-card-wide:row-start-1 @min-card-wide:border-b
                   @min-card-wide:border-border-subtle @min-card-wide:pb-[0.7rem]`
const WIDE_FILES = '@min-card-wide:col-span-2 @min-card-wide:row-start-2'

// Follower and wide classes can apply together, so their values must agree regardless of emission order.
const FOLLOWER_GRID = 'grid grid-cols-[minmax(0,1fr)_auto] items-start'
const FOLLOWER_BAND = 'row-start-1 border-b border-border-subtle pb-[0.7rem]'
const FOLLOWER_PLACE = 'col-span-2 row-start-2'
const FOLLOWER_FILES = `${FOLLOWER_PLACE} flex flex-wrap items-start gap-[0.45rem]`

const STACK_STEP = 'mt-[clamp(0.85rem,2.4vw,1.15rem)]'

export const CARD_ROOM: Record<ShelfRole, string> = {
  alone: '',
  lead: '',
  follower: '[--card-room-set:1rem] stage-tall:[--card-room-set:1.7rem]',
}

export const FRAME: Record<ShelfRole, string> = {
  alone: WIDE_GRID,
  lead: WIDE_GRID,
  follower: `${WIDE_GRID} ${FOLLOWER_GRID}`,
}

export const HEAD: Record<ShelfRole, string> = {
  alone: `${WIDE_BAND} text-[clamp(1.2rem,4.4vw,1.6rem)]`,
  lead: `${WIDE_BAND} text-[1.05rem]`,
  follower: `${WIDE_BAND} ${FOLLOWER_BAND} col-start-1 pe-[clamp(0.75rem,1.4vw,1.2rem)] text-[1.05rem]`,
}

export const HEAD_GAP: Record<ShelfRole, string> = {
  alone: 'gap-x-[0.7rem]',
  lead: 'gap-x-[0.7rem]',
  follower: 'gap-x-[0.55rem]',
}

export const KIND_LINE: Record<ShelfRole, string> = {
  alone: 'basis-full text-[0.68rem] uppercase leading-[1.4] tracking-[0.2em] mb-[0.1rem]',
  lead: 'basis-full text-[clamp(1.25rem,3.4svh,1.7rem)] leading-[1.1] tracking-[-0.01em] mb-[0.3rem]',
  follower: 'text-[1.15rem] leading-[1.15] tracking-[-0.005em]',
}

export const FILES: Record<ShelfRole, string> = {
  alone: `${WIDE_FILES} ${STACK_STEP}`,
  lead: `${WIDE_FILES} ${STACK_STEP}`,
  follower: `${WIDE_FILES} ${FOLLOWER_FILES} mt-[0.45rem]`,
}

// Keep the note separate from the file flow: combining inline-block and flex depends on Tailwind's emission order.
export const NOTE_PLACE: Record<ShelfRole, string> = {
  alone: `${WIDE_FILES} ${STACK_STEP}`,
  lead: `${WIDE_FILES} ${STACK_STEP}`,
  follower: `${WIDE_FILES} ${FOLLOWER_PLACE} mt-[0.6rem]`,
}

export const PACKAGE_VARIANT: Record<ShelfRole, 'package' | 'packageSet'> = {
  alone: 'package',
  lead: 'packageSet',
  follower: 'packageSet',
}

const SET_LINE = 'flex flex-wrap gap-[0.45rem]'
// The 13rem basis fits the longest described image name; uncapped growth keeps a lone image full-width.
// Stage-specific flex values must stay exclusive so neither depends on emission order.
const SET_BLOCK = 'grid flex-[1_1_13rem] stage-tall:flex-[1_1_100%]'
const SET_CHIP = 'flex-[0_1_auto]'

export const ARTIFACT_VARIANT: Record<ShelfRole, 'artifact' | 'artifactSet' | 'pieceSet'> = {
  alone: 'artifact',
  lead: 'artifactSet',
  follower: 'pieceSet',
}
export const ARTIFACT_ITEM: Record<ShelfRole, string> = {
  alone: '@min-card-wide:flex-[1_1_15rem]',
  lead: SET_BLOCK,
  follower: SET_CHIP,
}
export const ARTIFACT_LINE: Record<ShelfRole, string> = {
  alone: `flex flex-col gap-[0.45rem] @min-card-wide:flex-row @min-card-wide:flex-wrap
          [&:not(:first-child)]:mt-[0.55rem]`,
  lead: `${SET_LINE} [&:not(:first-child)]:mt-[0.45rem]`,
  follower: SET_LINE,
}

export const SUPPORT_VARIANT: Record<ShelfRole, 'piece' | 'pieceSet'> = {
  alone: 'piece',
  lead: 'pieceSet',
  follower: 'pieceSet',
}
export const SUPPORT_ITEM: Record<ShelfRole, string> = {
  alone: 'max-w-[22rem] flex-[1_1_auto]',
  lead: SET_CHIP,
  follower: SET_CHIP,
}
export const SUPPORT_LINE: Record<ShelfRole, string> = {
  alone: 'flex flex-wrap gap-[0.3rem] @min-card-wide:gap-[0.45rem] [&:not(:first-child)]:mt-[0.35rem]',
  lead: `${SET_LINE} [&:not(:first-child)]:mt-[0.35rem]`,
  follower: SET_LINE,
}

export const NOTES: Record<ShelfRole, string> = {
  alone: `${WIDE_BAND} border-t border-border-subtle ${STACK_STEP} pt-[0.85rem]`,
  lead: `${WIDE_BAND} border-t border-border-subtle ${STACK_STEP} pt-[0.85rem]`,
  follower: `${WIDE_BAND} ${FOLLOWER_BAND} col-start-2 self-end border-t-0 mt-0 pt-0`,
}

// On a tall stage, the lead's card spacing scales with viewport height and must not enlarge the package.
export const PACKAGE_ROOM: Record<ShelfRole, string> = {
  alone: '@min-card-wide:[--file-room:var(--card-room)]',
  lead: 'stage-wide:@min-card-wide:[--file-room:var(--card-room)]',
  follower: '[--file-room:0.7rem] w-full',
}

// Use one wash declaration per role: Tailwind does not order competing arbitrary properties.
export const WASH: Record<ShelfRole, string> = {
  alone: '[--wash:12%]',
  lead: '[--wash:26%]',
  follower: '[--wash:18%]',
}
