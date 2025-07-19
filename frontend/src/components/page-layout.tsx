import React from 'react'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  headerContent?: React.ReactNode
  fullHeight?: boolean
}

export const PageLayout = ({
  children,
  title,
  description,
  className,
  headerContent,
  fullHeight = false
}: PageLayoutProps) => {
  return (
    <div 
      className={cn(
        'space-y-6',
        fullHeight && 'h-full flex flex-col',
        className
      )}
    >
      {(title || description || headerContent) && (
        <div className="flex items-start justify-between">
          <div className="space-y-1 text-left">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight text-left">{title}</h1>
            )}
            {description && (
              <p className="text-muted-foreground text-left">{description}</p>
            )}
          </div>
          {headerContent && (
            <div className="flex items-center space-x-2">
              {headerContent}
            </div>
          )}
        </div>
      )}
      <div className={cn(fullHeight && 'flex-1 overflow-hidden')}>
        {children}
      </div>
    </div>
  )
}

PageLayout.displayName = 'PageLayout' 