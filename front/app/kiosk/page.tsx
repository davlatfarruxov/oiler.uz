'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UzbekLicensePlate } from '@/components/UzbekLicensePlate'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Car, Calendar, Gauge, CheckCircle, XCircle } from 'lucide-react'

type VehicleRow = {
  _id: string
  plateNumber: string
  brand?: string
  vehicleModel?: string
  customer?: { name?: string; phone?: string }
}

type UnifiedRow = {
  type: string
  publicUuid?: string
  date?: string
}

interface PublicServiceData {
  uuid: string
  plateNumber: string
  vehicleBrand: string
  vehicleModel: string
  customerName: string
  serviceDate: string
  serviceType: string
  currentMileage: number
  nextServiceMileage: number
  companyName: string
  companyPhone: string
  oilInfo?: {
    hasOil: boolean
    oilDetails: string | null
    oilQuantity: number
  }
  filters?: {
    oilFilter: boolean
    airFilter: boolean
    cabinFilter: boolean
    fuelFilter: boolean
  }
  services?: string[]
}

const KIOSK_CACHE_PREFIX = 'kiosk:lastOilService:'
const KIOSK_CACHE_GLOBAL_KEY = `${KIOSK_CACHE_PREFIX}latest`

function unwrapData<T>(res: { data?: { data?: T } }): T | null {
  const d = res.data as { data?: T } | undefined
  return d?.data ?? null
}

function cacheKeyForVehicle(vehicleId: string): string {
  return `${KIOSK_CACHE_PREFIX}${vehicleId}`
}

function readKioskCache(key: string): PublicServiceData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as PublicServiceData
  } catch {
    return null
  }
}

function writeKioskCache(vehicleId: string, data: PublicServiceData): void {
  if (typeof window === 'undefined') return
  try {
    const encoded = JSON.stringify(data)
    localStorage.setItem(cacheKeyForVehicle(vehicleId), encoded)
    localStorage.setItem(KIOSK_CACHE_GLOBAL_KEY, encoded)
  } catch {
    // ignore storage errors
  }
}

/** O‘ng qism: masalan "777 ZZZ" yoki "Q 935 DB" */
function formatTailMain(tail: string): string {
  const t = tail.toUpperCase()
  if (!t) return ''
  if (t.length <= 3) return t
  if (t.length === 6) {
    if (/^\d{3}[A-Z]{3}$/.test(t)) return `${t.slice(0, 3)} ${t.slice(3)}`
    if (/^[A-Z]\d{3}[A-Z]{2}$/.test(t)) return `${t[0]} ${t.slice(1, 4)} ${t.slice(4)}`
    return `${t.slice(0, 3)} ${t.slice(3)}`
  }
  if (t.length === 5) return `${t.slice(0, 3)} ${t.slice(3)}`
  if (t.length === 4) return `${t.slice(0, 2)} ${t.slice(2)}`
  const mid = Math.ceil(t.length / 2)
  return `${t.slice(0, mid)} ${t.slice(mid)}`
}

function parseKioskPlateParts(raw: string): { region: string; main: string } {
  const c = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  if (!c) return { region: '—', main: '' }
  if (c.length <= 2) return { region: c, main: '' }
  return { region: c.slice(0, 2), main: formatTailMain(c.slice(2)) }
}

/** Oq davlat raqami (chap viloyat, o‘ng asosiy); bayroq / UZ yo‘q */
function KioskPlateStrip({
  plateNumber,
  size = 'hero',
}: {
  plateNumber: string
  size?: 'hero' | 'compact'
}) {
  const { region, main } = parseKioskPlateParts(plateNumber)
  const hero = size === 'hero'

  return (
    <div
      className={
        hero
          ? 'flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center overflow-auto px-[1vmin] py-[0.5vmin]'
          : 'flex w-full justify-center overflow-x-auto px-3 py-2'
      }
    >
      <div
        className={`flex overflow-hidden rounded-xl border-black bg-white shadow-[0_4px_24px_rgba(0,0,0,0.35)] ${
          hero
            ? 'aspect-[3.95/1] w-[min(99vw,calc((50dvh-1rem)*3.95))] max-w-full border-[0.35vmin]'
            : 'aspect-[3.95/1] w-full max-w-2xl border-2 md:max-w-4xl'
        }`}
      >
        <div
          className={`flex w-[20%] min-w-0 shrink-0 items-center justify-center border-black bg-white px-[0.35vmin] ${
            hero ? 'border-r-[0.35vmin]' : 'border-r-2'
          }`}
        >
          <span
            className="max-w-full font-black tabular-nums tracking-tighter text-black"
            style={{
              fontFamily: 'Arial Black, Impact, "Franklin Gothic Heavy", sans-serif',
              fontSize: hero ? 'clamp(5rem, min(53vmin, 38vw), 15rem)' : 'clamp(3.5rem, 13.5vw, 7rem)',
              lineHeight: 0.95,
            }}
          >
            {region}
          </span>
        </div>
        <div
          className={`flex min-w-0 flex-1 items-center justify-center bg-white ${
            hero ? 'px-[0.6vmin] py-[0.25vmin]' : 'px-1.5'
          }`}
        >
          <span
            className="max-w-full text-center font-black uppercase leading-none tracking-[0.02em] text-black"
            style={{
              fontFamily: 'Arial Black, Impact, "Franklin Gothic Heavy", sans-serif',
              fontSize: hero ? 'clamp(3rem, min(24vmin, 20vw), 12rem)' : 'clamp(3.5rem, 13.5vw, 7rem)',
              
            }}
          >
            {main || '\u00A0'}
          </span>
        </div>
      </div>
    </div>
  )
}

/** QR public sahifasidagi ma’lumotlar — katta shrift bilan */
function KioskPublicServiceView({ data, variant = 'default' }: { data: PublicServiceData; variant?: 'default' | 'wall' }) {
  if (variant === 'wall') {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-black text-white">
        <div className="shrink-0 pb-2 pt-4  md:pt-5">
          <KioskPlateStrip plateNumber={data.plateNumber} size="compact" />
        </div>
        <div className="min-h-0 flex-1 px-3 pb-3 pt-10 md:px-6">
          <div className="mx-auto flex h-full max-w-6xl flex-col gap-3">
            <div className="text-center">
              {/* <p className="text-base font-black uppercase tracking-[0.16em] text-[#39ff14] md:text-lg">{data.companyName}</p> */}
            </div>

            <div className="grid gap-3 md:grid-cols-2 md:gap-x-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Model</p>
                <p className="mt-1 text-2xl font-bold leading-tight md:text-3xl">
                  {data.vehicleBrand} {data.vehicleModel}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Xizmat turi</p>
                <p className="mt-1.5">
                  <Badge variant="outline" className="border-[#39ff14]/50 bg-[#39ff14]/10 text-base text-[#39ff14]">
                    {data.serviceType}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                <Calendar className="h-7 w-7 shrink-0 text-[#39ff14]" />
                <div>
                  <p className="text-sm uppercase text-zinc-500">Xizmat sanasi</p>
                  <p className="text-2xl font-bold md:text-3xl">
                    {new Date(data.serviceDate).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                <Gauge className="h-7 w-7 shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm uppercase text-zinc-500">Probeg</p>
                  <p className="text-2xl font-bold md:text-3xl">{(data.currentMileage || 0).toLocaleString()} km</p>
                </div>
              </div>
              {data.nextServiceMileage > 0 && (
                <div className="rounded-lg border border-indigo-500/50 bg-indigo-950/40 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-indigo-200/80">Keyingi xizmat</p>
                  <p className="mt-1 text-2xl font-black text-indigo-200 md:text-3xl">
                    {(data.nextServiceMileage || 0).toLocaleString()} km
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Qolgan: {((data.nextServiceMileage || 0) - (data.currentMileage || 0)).toLocaleString()} km
                  </p>
                </div>
              )}
            </div>

            {(data.oilInfo?.hasOil || data.filters) && (
              <div className="grid gap-3 md:grid-cols-2">
                {data.oilInfo?.hasOil && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                    <p className="text-base font-black uppercase tracking-wider text-[#39ff14]">Moy</p>
                    <p className="mt-2 text-xl font-semibold md:text-2xl">{data.oilInfo.oilDetails || 'Mijoz moy'}</p>
                    {data.oilInfo.oilQuantity > 0 && (
                      <p className="mt-1 text-base text-zinc-300">Miqdor: {data.oilInfo.oilQuantity} L</p>
                    )}
                  </div>
                )}

                {data.filters && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                    <p className="text-base font-black uppercase tracking-wider text-[#39ff14]">Filterlar</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-base">
                      {(
                        [
                          ['oilFilter', 'Moy filteri'],
                          ['airFilter', 'Havo filteri'],
                          ['cabinFilter', 'Salon filteri'],
                          ['fuelFilter', "Yoqilg'i filteri"],
                        ] as const
                      ).map(([key, label]) => {
                        const on = !!(data.filters as Record<string, boolean>)[key]
                        return (
                          <div key={key} className="flex items-center gap-2">
                            {on ? (
                              <CheckCircle className="h-5 w-5 shrink-0 text-[#39ff14]" />
                            ) : (
                              <XCircle className="h-5 w-5 shrink-0 text-zinc-600" />
                            )}
                            <span className={on ? 'font-medium text-white' : 'text-zinc-500'}>{label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {data.services && data.services.length > 0 && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                <p className="text-base font-black uppercase tracking-wider text-[#39ff14]">Bajarilgan xizmatlar</p>
                <ul className="mt-2 grid grid-cols-1 gap-1 text-base md:grid-cols-2">
                  {data.services.map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 shrink-0 text-[#39ff14]" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-center text-sm text-zinc-600">Xizmatimizdan foydalanganingiz uchun rahmat</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-16">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-white md:text-4xl">{data.companyName}</h1>
      </div>

      <Card className="border-zinc-700 bg-zinc-900/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-white">
            <Car className="h-7 w-7 text-sky-400" />
            Mashina
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-lg md:grid-cols-2 md:text-xl">
          <div>
            <p className="text-sm text-zinc-500">Davlat raqami</p>
            <p className="text-2xl font-bold text-sky-400 md:text-3xl">{data.plateNumber}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Model</p>
            <p className="font-semibold text-white">
              {data.vehicleBrand} {data.vehicleModel}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Xizmat</p>
            <Badge variant="outline" className="text-base">
              {data.serviceType}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-zinc-700 bg-zinc-900/90">
          <CardContent className="flex items-center gap-4 pt-8">
            <Calendar className="h-12 w-12 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm text-zinc-500">Xizmat sanasi</p>
              <p className="text-2xl font-semibold text-white">
                {new Date(data.serviceDate).toLocaleDateString('uz-UZ')}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-700 bg-zinc-900/90">
          <CardContent className="flex items-center gap-4 pt-8">
            <Gauge className="h-12 w-12 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm text-zinc-500">Probeg</p>
              <p className="text-2xl font-semibold text-white">{(data.currentMileage || 0).toLocaleString()} km</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.nextServiceMileage > 0 && (
        <Card className="border-indigo-500/40 bg-indigo-950/30">
          <CardContent className="py-8 text-center">
            <p className="text-zinc-400">Keyingi xizmat</p>
            <p className="mt-2 text-4xl font-bold text-indigo-300 md:text-5xl">
              {(data.nextServiceMileage || 0).toLocaleString()} km
            </p>
            <p className="mt-2 text-lg text-zinc-400">
              Qolgan: {((data.nextServiceMileage || 0) - (data.currentMileage || 0)).toLocaleString()} km
            </p>
          </CardContent>
        </Card>
      )}

      {data.oilInfo?.hasOil && (
        <Card className="border-zinc-700 bg-zinc-900/90">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Moy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-lg">
            <div>
              <p className="text-sm text-zinc-500">Tafsilot</p>
              <p className="font-semibold text-white">{data.oilInfo.oilDetails || 'Mijoz moy'}</p>
            </div>
            {data.oilInfo.oilQuantity > 0 && (
              <div>
                <p className="text-sm text-zinc-500">Miqdor</p>
                <p className="font-semibold text-white">{data.oilInfo.oilQuantity} L</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {data.filters && (
        <Card className="border-zinc-700 bg-zinc-900/90">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Filterlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-lg md:text-xl">
              {(
                [
                  ['oilFilter', 'Moy filteri'],
                  ['airFilter', 'Havo filteri'],
                  ['cabinFilter', 'Salon filteri'],
                  ['fuelFilter', "Yoqilg'i filteri"]
                ] as const
              ).map(([key, label]) => {
                const on = !!(data.filters as Record<string, boolean>)[key]
                return (
                  <div key={key} className="flex items-center gap-3">
                    {on ? (
                      <CheckCircle className="h-7 w-7 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="h-7 w-7 shrink-0 text-zinc-600" />
                    )}
                    <span className={on ? 'font-medium text-white' : 'text-zinc-500'}>{label}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {data.services && data.services.length > 0 && (
        <Card className="border-zinc-700 bg-zinc-900/90">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Bajarilgan xizmatlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-lg">
            {data.services.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-white">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>{s}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-center  text-zinc-500" style={{fontSize: 'clamp(2rem, 9vw, 3rem)'}}>Xizmatimizdan foydalanganingiz uchun rahmat</p>
    </div>
  )
}

function KioskManualSearch() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [plate, setPlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<'input' | 'new_client' | 'known'>('input')
  const [vehicle, setVehicle] = useState<VehicleRow | null>(null)

  useEffect(() => {
    setReady(!!(typeof window !== 'undefined' && localStorage.getItem('accessToken')))
  }, [])

  const onPlateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    let value = ''
    if (input.length >= 1) value += input[0].replace(/[^0-9]/g, '')
    if (input.length >= 2) value += input[1].replace(/[^0-9]/g, '')
    if (input.length > 2) value += input.slice(2, 8)
    setPlate(value)
    setPhase('input')
    setVehicle(null)
  }, [])

  const searchPlate = useCallback(async () => {
    if (plate.length !== 8) return
    setLoading(true)
    setVehicle(null)
    try {
      const res = await api.get(`/vehicles/search/${plate}`)
      const v = unwrapData<VehicleRow>(res)
      if (v?._id) {
        setVehicle(v)
        setPhase('known')
      }
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 404) setPhase('new_client')
    } finally {
      setLoading(false)
    }
  }, [plate])

  useEffect(() => {
    if (plate.length === 8 && phase === 'input' && !loading) void searchPlate()
  }, [plate, phase, loading, searchPlate])

  const resetKiosk = () => {
    setPlate('')
    setPhase('input')
    setVehicle(null)
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-md text-lg text-zinc-300">Avval tizimga kiring, keyin /kiosk sahifasini qayta oching.</p>
        <Button asChild variant="secondary">
          <Link href="/login">Kirish</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="space-y-1 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Kiosk (qo‘lda qidiruv)</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mashina raqami</h1>
      </header>
      <div className="flex flex-col items-center gap-6">
        <div className="w-full max-w-xl space-y-3">
          <Label htmlFor="kiosk-plate" className="text-zinc-300">
            Davlat raqami
          </Label>
          <Input
            id="kiosk-plate"
            value={plate}
            onChange={onPlateChange}
            maxLength={8}
            className="h-14 border-zinc-600 bg-zinc-900 text-center font-mono text-2xl tracking-[0.25em] text-white"
          />
        </div>
        <div className="flex w-full justify-center overflow-x-auto overflow-y-auto py-6">
          <UzbekLicensePlate value={plate} scale={1.05} />
        </div>
        {loading && phase === 'input' && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Qidirilmoqda…
          </div>
        )}
        {phase === 'new_client' && (
          <div className="w-full max-w-xl space-y-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 p-6 text-center">
            <Badge className="bg-amber-500 text-lg text-black">Yangi mijoz</Badge>
            <Button size="lg" onClick={() => router.push(`/dashboard/service/add?plate=${plate}`)}>
              Mashinani kiritish
            </Button>
            <Button variant="outline" onClick={resetKiosk}>
              Boshqa raqam
            </Button>
          </div>
        )}
        {phase === 'known' && vehicle && (
          <Button asChild size="lg">
            <Link href={`/dashboard/service/${vehicle._id}`}>Mashina sahifasi</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

function KioskVehicleModes() {
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get('vehicleId') || ''
  const screen = (searchParams.get('screen') || '') as 'new' | 'service' | ''

  const [tokenReady, setTokenReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicle, setVehicle] = useState<VehicleRow | null>(null)
  const [publicData, setPublicData] = useState<PublicServiceData | null>(null)
  const [noServiceMsg, setNoServiceMsg] = useState<string | null>(null)

  useEffect(() => {
    setTokenReady(!!(typeof window !== 'undefined' && localStorage.getItem('accessToken')))
  }, [])

  const load = useCallback(async () => {
    if (!vehicleId || (screen !== 'new' && screen !== 'service')) {
      setLoading(false)
      return
    }
    if (!tokenReady) return

    setLoading(true)
    setError(null)
    setVehicle(null)
    setPublicData(null)
    setNoServiceMsg(null)

    try {
      const vRes = await api.get(`/vehicles/${vehicleId}`)
      const v = unwrapData<VehicleRow>(vRes)
      if (!v?._id) {
        setError('Mashina topilmadi')
        setLoading(false)
        return
      }
      setVehicle(v)

      if (screen === 'service') {
        const vehicleCache = readKioskCache(cacheKeyForVehicle(vehicleId))
        const globalCache = readKioskCache(KIOSK_CACHE_GLOBAL_KEY)
        const fallbackCache = vehicleCache || globalCache
        if (fallbackCache) {
          setPublicData(fallbackCache)
        }

        const hRes = await api.get(`/vehicles/${vehicleId}/unified-history`)
        const list = (unwrapData<UnifiedRow[]>(hRes) || []) as UnifiedRow[]
        const latestOilChange = list.find((row) => row.type === 'oilChange' && !!row.publicUuid)
        if (!latestOilChange?.publicUuid) {
          if (!fallbackCache) {
            setNoServiceMsg(
              list.length === 0
                ? 'Hali moy almashtirish yozuvi yo‘q.'
                : 'Moy almashtirish uchun ochiq yozuv topilmadi.'
            )
          }
          return
        }
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'
        const pubRes = await fetch(`${base}/public/service/${latestOilChange.publicUuid}`)
        if (!pubRes.ok) {
          if (!fallbackCache) setError('Ochiq moy almashtirish sahifasini yuklashda xatolik')
          return
        }
        const json = await pubRes.json()
        const freshData = json.data as PublicServiceData
        setPublicData(freshData)
        writeKioskCache(vehicleId, freshData)
      }
    } catch {
      const fallbackCache = readKioskCache(cacheKeyForVehicle(vehicleId)) || readKioskCache(KIOSK_CACHE_GLOBAL_KEY)
      if (screen === 'service' && fallbackCache) {
        setPublicData(fallbackCache)
      } else {
        setError('Ma’lumotlarni yuklashda xatolik')
      }
    } finally {
      setLoading(false)
    }
  }, [vehicleId, screen, tokenReady])

  useEffect(() => {
    void load()
  }, [load])

  if (!tokenReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    )
  }

  if (!vehicleId || (screen !== 'new' && screen !== 'service')) {
    return <KioskManualSearch />
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-black text-zinc-400">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p>Yuklanmoqda…</p>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-black p-6">
        <p className="text-xl text-red-300">{error || 'Ma’lumot yo‘q'}</p>
        <Button asChild variant="secondary">
          <Link href="/kiosk">Orqaga</Link>
        </Button>
      </div>
    )
  }

  if (screen === 'new') {
    return (
      <div className="flex min-h-dvh flex-col bg-black">
        <div className="flex h-[40dvh] min-h-0 w-full shrink-0 flex-col overflow-auto">
          <KioskPlateStrip plateNumber={vehicle.plateNumber} size="hero" />
        </div>
        <div className="flex h-[60dvh] min-h-0 w-full shrink-0 flex-col items-center justify-center px-4">
          <p
            className="text-center font-black uppercase leading-none tracking-[0.12em] text-[#39ff14] drop-shadow-[0_0_24px_rgba(57,255,20,0.4)]"
            style={{
              fontFamily: 'Arial Black, Impact, "Franklin Gothic Heavy", sans-serif',
              fontSize: 'clamp(2.75rem, min(18vw, 14vmin), 10rem)',
            }}
          >
            YANGI MIJOZ
          </p>
        </div>
      </div>
    )
  }

  // screen === 'service'
  if (noServiceMsg) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-black p-8">
        <div className="w-full max-w-5xl overflow-x-auto">
          <KioskPlateStrip plateNumber={vehicle.plateNumber} size="compact" />
        </div>
        <p className="max-w-2xl text-center text-2xl font-semibold text-zinc-200 md:text-3xl">{noServiceMsg}</p>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/service/${vehicle._id}`}>Operator sahifasi</Link>
        </Button>
      </div>
    )
  }

  if (!publicData) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    )
  }

  return <KioskPublicServiceView data={publicData} variant="wall" />
}

export default function KioskPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-black text-zinc-400">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      }
    >
      <KioskVehicleModes />
    </Suspense>
  )
}
