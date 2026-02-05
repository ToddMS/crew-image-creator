import React from 'react'
import './DataContainer.css'
import { LoadingState } from './LoadingState'
import { ErrorBoundary } from './ErrorBoundary'

interface DataContainerProps {
  title?: string
  isLoading?: boolean
  error?: string | Error
  isEmpty?: boolean
  emptyTitle?: string
  emptyMessage?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  children: React.ReactNode
  className?: string
  height?: 'auto' | 'fixed'
  scrollable?: boolean
  gridLayout?: boolean
}

export function DataContainer({
  title,
  isLoading,
  error,
  isEmpty,
  emptyTitle = "No items found",
  emptyMessage = "Get started by creating your first item.",
  emptyActionLabel = "Create New",
  onEmptyAction,
  children,
  className = "",
  height = 'fixed',
  scrollable = true,
  gridLayout = true
}: DataContainerProps) {
  const containerClasses = [
    'data-container',
    height === 'fixed' ? 'data-container--fixed-height' : 'data-container--auto-height',
    scrollable && height === 'fixed' ? 'data-container--scrollable' : '',
    gridLayout ? 'data-container--grid' : '',
    className
  ].filter(Boolean).join(' ')

  if (error) {
    return (
      <div className={containerClasses}>
        {title && <h2 className="data-container__title">{title}</h2>}
        <div className="data-container__content">
          <ErrorBoundary error={error} />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={containerClasses}>
        {title && <h2 className="data-container__title">{title}</h2>}
        <div className="data-container__content">
          <LoadingState type="pulse" message="Loading..." />
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className={containerClasses}>
        {title && <h2 className="data-container__title">{title}</h2>}
        <div className="data-container__content">
          <div className="empty-state">
            <h3 className="empty-state-title">{emptyTitle}</h3>
            <p className="empty-state-message">{emptyMessage}</p>
            {onEmptyAction && (
              <button
                className="crew-action-btn primary"
                onClick={onEmptyAction}
              >
                {emptyActionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      {title && <h2 className="data-container__title">{title}</h2>}
      <div className="data-container__content">
        {children}
      </div>
    </div>
  )
}