'use client'

import dynamic from 'next/dynamic'
import type { LocationWithGeo } from '@/lib/types'

const AffordabilityMap = dynamic(() => import('@/components/AffordabilityMap'), { ssr: false })

interface Props {
  locations: LocationWithGeo[]
  totalLocations: number
}

export default function MapClient({ locations, totalLocations }: Props) {
  return <AffordabilityMap locations={locations} totalLocations={totalLocations} />
}
