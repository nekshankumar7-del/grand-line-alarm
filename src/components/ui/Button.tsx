import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { pressable } from '@/motion/variants'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface StyleProps {
  variant?: Variant
  size?: Size
  className?: string
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white border-ink hard-shadow',
  secondary: 'bg-gold text-ink border-ink hard-shadow',
  ghost: 'bg-white/10 text-white border-white/40 backdrop-blur',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-base',
  md: 'px-5 py-2.5 text-xl',
  lg: 'px-8 py-4 text-2xl md:text-3xl',
}

function buttonClass({ variant = 'primary', size = 'md', className }: StyleProps) {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-[3px] font-display tracking-wider',
    'disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}

const MotionLink = motion.create(Link)

export function Button({ variant, size, className, ...props }: StyleProps & HTMLMotionProps<'button'>) {
  return <motion.button type="button" {...pressable} className={buttonClass({ variant, size, className })} {...props} />
}

interface ButtonLinkProps extends StyleProps {
  to: string
  children: ReactNode
}

export function ButtonLink({ to, children, ...style }: ButtonLinkProps) {
  return (
    <MotionLink to={to} {...pressable} className={buttonClass(style)}>
      {children}
    </MotionLink>
  )
}

interface ButtonAnchorProps extends StyleProps {
  href: string
  download?: boolean
  external?: boolean
  children: ReactNode
}

export function ButtonAnchor({ href, download, external, children, ...style }: ButtonAnchorProps) {
  return (
    <motion.a
      href={href}
      download={download || undefined}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      {...pressable}
      className={buttonClass(style)}
    >
      {children}
    </motion.a>
  )
}
