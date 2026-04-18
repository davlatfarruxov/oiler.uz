'use client'

import { cn } from '@/lib/utils'

/** 8 belgi: 01A234BC → viloyat | asosiy qism (A 234 BC) */
function splitPlate(clean: string): { region: string; main: string; partial: boolean } {
  const c = clean.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  const partial = c.length < 8
  const region = c.slice(0, 2).padEnd(2, '\u00B7')
  const body = c.slice(2, 8)
  let main = ''
  if (body.length === 0) {
    main = '\u00B7\u00B7\u00B7 \u00B7\u00B7\u00B7 \u00B7\u00B7'
  } else if (body.length < 6) {
    const padded = body.padEnd(6, '\u00B7')
    main = `${padded[0]} ${padded.slice(1, 4)} ${padded.slice(4, 6)}`
  } else {
    main = `${body[0]} ${body.slice(1, 4)} ${body.slice(4, 6)}`
  }
  return { region, main, partial }
}

type Props = {
  /** Davlat raqami (8 ta belgi yoki qisman) */
  value: string
  className?: string
  /** Kattalashtirish (masalan tablet: 1.15) */
  scale?: number
}

/**
 * O‘zbekiston davlat raqami uslubi (yaxlitlangan): viloyat katakchasi, vertikal ajratgich,
 * asosiy qator, o‘ngda bayroq + UZ.
 */
export function UzbekLicensePlate({ value, className, scale = 1 }: Props) {
  const { region, main, partial } = splitPlate(value)

  return (
    <div
      className={cn('inline-flex max-w-full select-none', className)}
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
    >
      <div
        className={cn(
          'relative flex w-full min-w-[280px] max-w-[640px] overflow-hidden rounded-lg',
          'border-[3px] border-black bg-white text-black shadow-[0_4px_0_0_rgba(0,0,0,0.25)]',
          partial && 'opacity-90'
        )}
      >
        {/* Montaj nuqtalari (dekor) */}
        <span className="pointer-events-none absolute left-1.5 top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full border border-black/40 bg-neutral-800" />
        <span className="pointer-events-none absolute right-1.5 top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full border border-black/40 bg-neutral-800" />

        {/* Viloyat */}
        <div className="flex w-[22%] shrink-0 flex-col items-center justify-center border-r-[3px] border-black py-3 sm:py-4">
          <span
            className="font-black leading-none tracking-tight text-black"
            style={{
              fontFamily: 'Arial Black, Impact, Haettenschweiler, sans-serif',
              fontSize: 'clamp(1.75rem, 8vw, 3.25rem)'
            }}
          >
            {region}
          </span>
        </div>

        {/* Asosiy + bayroq */}
        <div className="flex min-w-0 flex-1 items-stretch justify-between gap-2 py-2 pl-2 pr-2 sm:pl-4 sm:pr-3">
          <div className="flex min-w-0 flex-1 items-center">
            <span
              className="truncate font-black uppercase leading-none tracking-tight text-black"
              style={{
                fontFamily: 'Arial Black, Impact, Haettenschweiler, sans-serif',
                fontSize: 'clamp(1.35rem, 5.5vw, 2.75rem)',
                letterSpacing: '-0.02em'
              }}
            >
              {main}
            </span>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 pr-1">
            <div
              className="flex h-9 w-10 flex-col overflow-hidden rounded-sm border border-black shadow-sm sm:h-11 sm:w-12"
              aria-hidden
            >
              <div className="h-[33.333%] min-h-[3px] bg-[#0099b5]" />
              <div className="relative h-[33.333%] min-h-[3px] bg-white">
                <div className="absolute inset-x-0 top-[22%] h-px bg-[#ce1126]" />
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#ce1126]" />
                <div className="absolute inset-x-0 bottom-[22%] h-px bg-[#ce1126]" />
              </div>
              <div className="h-[33.333%] min-h-[3px] bg-[#43b02a]" />
            </div>
            <span
              className="text-[0.65rem] font-bold leading-none tracking-widest text-[#0099b5] sm:text-xs"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              UZ
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
