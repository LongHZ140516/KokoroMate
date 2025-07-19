import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LLMApp {
  name: string
  desc: string
  logo: React.ReactNode
  connected: boolean
}

interface LLMCardProps {
  apps: LLMApp[]
  className?: string
  onConnect?: (appName: string) => void
}

export const LLMCard = ({ apps, className, onConnect }: LLMCardProps) => {
  return (
    <ul className={cn(
      'faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 pb-16 md:grid-cols-2 lg:grid-cols-3',
      className
    )}>
      {apps.map((app) => (
        <li
          key={app.name}
          className='rounded-lg border p-4 hover:shadow-md'
        >
          <div className='mb-6 flex items-center justify-between'>
            <div
              className='bg-muted flex size-10 items-center justify-center rounded-lg p-2'
            >
              {app.logo !== null ? (
                app.logo
              ) : (
                <span className="text-lg font-semibold">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              )}
              {/* {app.logo} */}
            </div>
            <Button
              variant='outline'
              size='sm'
              className={`${app.connected ? 'border border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900' : ''}`}
              onClick={() => onConnect?.(app.name)}
            >
              {app.connected ? 'Connected' : 'Connect'}
            </Button>
          </div>
          <div>
            <h2 className='mb-1 font-semibold text-left'>{app.name}</h2>
            <p className='line-clamp-2 text-gray-500 text-left'>{app.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

LLMCard.displayName = 'LLMCard' 