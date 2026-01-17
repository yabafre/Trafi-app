'use client';

import { Search } from 'lucide-react';
import { useQueryState, parseAsString } from 'nuqs';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef } from 'react';

interface SearchCommandProps {
  className?: string;
  placeholder?: string;
}

/**
 * SearchCommand Component
 * Global search with keyboard shortcut (CMD+K / CTRL+K)
 * Uses nuqs for URL state management
 */
export function SearchCommand({
  className,
  placeholder = 'Search (CMD+K)',
}: SearchCommandProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({
      shallow: true, // Don't trigger server re-render
      throttleMs: 300, // Throttle URL updates
    })
  );

  // Handle keyboard shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={cn('relative', className)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value || null)}
        placeholder={placeholder}
        className={cn(
          'w-full h-9 pl-9 pr-3',
          'bg-muted/50 border border-border',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
          'transition-colors duration-100'
        )}
      />
      {/* Keyboard shortcut hint */}
      <kbd
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2',
          'hidden sm:inline-flex items-center gap-1',
          'px-1.5 py-0.5 text-xs',
          'bg-background border border-border',
          'text-muted-foreground font-mono'
        )}
      >
        <span className="text-[10px]">CMD</span>
        <span>K</span>
      </kbd>
    </div>
  );
}
