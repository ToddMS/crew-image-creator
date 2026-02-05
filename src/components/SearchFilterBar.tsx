import React from 'react'
import './SearchFilterBar.css'

interface SearchFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
  sortOptions?: Array<{
    value: string
    label: string
  }>
  selectedSort?: string
  onSortChange?: (sort: string) => void
  actionButtons?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
    disabled?: boolean
  }>
  className?: string
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  placeholder = "Search...",
  sortOptions,
  selectedSort,
  onSortChange,
  actionButtons = [],
  className = ""
}: SearchFilterBarProps) {
  // No useEffect or filtering logic - just render the UI

  return (
    <div className={`search-filter-bar ${className}`}>
      <div className="search-filter-bar__primary">
        {/* Search Input */}
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="search-controls">
          <div className="search-controls-left">
            {/* Sort Dropdown */}
            {sortOptions && onSortChange && (
              <div className="sort-dropdown">
                <select
                  value={selectedSort || ''}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="sort-select"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="search-controls-right">
            {/* Action Buttons */}
            {actionButtons.map((button, index) => (
              <button
                key={index}
                className={`search-action-btn search-action-btn--${button.variant || 'primary'}`}
                onClick={(e) => {
                  button.onClick()
                  e.currentTarget.blur()
                }}
                disabled={button.disabled}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}