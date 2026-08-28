import type { ReactNode } from 'react'
import {
  Armchair,
  Bell,
  Bus,
  Cake,
  Camera,
  Car,
  Check,
  Coffee,
  Dog,
  EyeOff,
  Flame,
  Folder,
  Gamepad2,
  GraduationCap,
  Headphones,
  Heart,
  Home,
  Key,
  Laptop,
  LayoutGrid,
  Leaf,
  Lightbulb,
  Lock,
  Luggage,
  Menu,
  Moon,
  Music,
  Palmtree,
  PartyPopper,
  Pill,
  Plane,
  Rainbow,
  Receipt,
  ScrollText,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Sunrise,
  Target,
  Trophy,
  Utensils,
  WandSparkles,
  X,
  type LucideIcon,
} from 'lucide-react'
import { categoryIconName } from '../lib/categories'
import { resolveIconName } from '../lib/iconResolve'

export const LUCIDE_ICONS = {
  home: Home,
  house: Home,
  armchair: Armchair,
  key: Key,
  plane: Plane,
  palmtree: Palmtree,
  car: Car,
  bus: Bus,
  'party-popper': PartyPopper,
  cake: Cake,
  utensils: Utensils,
  coffee: Coffee,
  music: Music,
  'gamepad-2': Gamepad2,
  dog: Dog,
  laptop: Laptop,
  'graduation-cap': GraduationCap,
  heart: Heart,
  moon: Moon,
  flame: Flame,
  rainbow: Rainbow,
  trophy: Trophy,
  'shopping-cart': ShoppingCart,
  leaf: Leaf,
  'wand-sparkles': WandSparkles,
  camera: Camera,
  headphones: Headphones,
  luggage: Luggage,
  folder: Folder,
  sparkles: Sparkles,
  lightbulb: Lightbulb,
  'shopping-bag': ShoppingBag,
  pill: Pill,
  target: Target,
  'layout-grid': LayoutGrid,
  menu: Menu,
  settings: Settings,
  bell: Bell,
  lock: Lock,
  check: Check,
  x: X,
  receipt: Receipt,
  'scroll-text': ScrollText,
  'eye-off': EyeOff,
  sunrise: Sunrise,
} as const

export type LucideIconName = keyof typeof LUCIDE_ICONS

interface IconProps {
  name: string
  size?: number
  strokeWidth?: number
  className?: string
}

export function AppIcon({
  name,
  size = 18,
  strokeWidth = 1.75,
  className,
}: IconProps) {
  const resolved = resolveIconName(name) as LucideIconName
  const Icon = LUCIDE_ICONS[resolved] as LucideIcon
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden />
}

export function UiCheck({
  size = 18,
  className = 'ui-icon ui-icon-check',
}: {
  size?: number
  className?: string
}) {
  return <Check size={size} strokeWidth={1.75} className={className} aria-hidden />
}

export function UiLock({
  size = 15,
  className = 'ui-icon ui-icon-lock',
}: {
  size?: number
  className?: string
}) {
  return <Lock size={size} strokeWidth={1.75} className={className} aria-hidden />
}

export function UiExcluded({ className = 'ui-excluded' }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      —
    </span>
  )
}

export function CategoryIcon({
  id,
  size = 16,
  className,
}: {
  id: string
  size?: number
  className?: string
}) {
  return <AppIcon name={categoryIconName(id)} size={size} className={className} />
}

export function SpaceIcon({
  space,
  size = 18,
  className,
}: {
  space: { kind: string; icon?: string }
  size?: number
  className?: string
}) {
  const fallback =
    space.kind === 'viaje'
      ? 'plane'
      : space.kind === 'evento'
        ? 'party-popper'
        : space.kind === 'otro'
          ? 'folder'
          : 'home'
  const custom = space.icon?.trim()
  const name = custom ? resolveIconName(custom, fallback) : fallback
  return <AppIcon name={name} size={size} className={className} />
}

export function LockedLabel({ children }: { children: ReactNode }) {
  return (
    <span className="locked-label">
      <UiLock size={14} className="ui-icon ui-icon-lock ui-icon-inline" />
      {children}
    </span>
  )
}
