import { ReactNode } from 'react'
import './Button.css'

export interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'text'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left'
}: ButtonProps) {
  const baseClass = 'btn'
  const variantClass = `btn--${variant}`
  const sizeClass = `btn--${size}`
  const disabledClass = disabled ? 'btn--disabled' : ''

  const finalClassName = [
    baseClass,
    variantClass,
    sizeClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={finalClassName}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && iconPosition === 'left' && (
        <span className="btn__icon btn__icon--left">{icon}</span>
      )}
      <span className="btn__content">{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="btn__icon btn__icon--right">{icon}</span>
      )}
    </button>
  )
}

// Convenience components for common button types
export const PrimaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="primary" />
)

export const SecondaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="secondary" />
)

export const DangerButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="danger" />
)

export const TextButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="text" />
)

export const OutlineButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="outline" />
)