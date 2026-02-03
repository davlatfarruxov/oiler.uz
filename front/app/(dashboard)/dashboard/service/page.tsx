'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus, Loader2 } from 'lucide-react'

export default function ServicePage() {
  const router = useRouter()
  const [plateNumber, setPlateNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(null)

  const handleSearch = async () => {
    if (!plateNumber.trim()) return

    try {
      setIsSearching(true)
      setSearchResult(null)
      
      const response = await api.get(`/vehicles/search/${plateNumber.toUpperCase()}`)
      
      if (response.data.data) {
        // Vehicle found - redirect to detail page
        router.push(`/dashboard/service/${response.data.data._id}`)
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSearchResult('not-found')
      } else {
        alert('Search failed')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddVehicle = () => {
    router.push(`/dashboard/service/add?plate=${plateNumber.toUpperCase()}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Service Center</h1>
        <p className="text-muted-foreground mt-1">Search vehicle and manage oil changes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Vehicle</CardTitle>
          <CardDescription>Enter license plate number to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter plate number (e.g., ABC-1234)"
              value={plateNumber}
              onChange={(e) => {
                setPlateNumber(e.target.value.toUpperCase())
                setSearchResult(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 text-lg font-bold"
              disabled={isSearching}
            />
            <Button 
              onClick={handleSearch} 
              size="lg"
              disabled={isSearching || !plateNumber.trim()}
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {searchResult === 'not-found' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900 mb-3">
                Vehicle <strong>{plateNumber}</strong> not found in database.
              </p>
              <Button onClick={handleAddVehicle} className="gap-2">
                <Plus className="w-4 h-4" />
                Add New Vehicle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Services</TabsTrigger>
          <TabsTrigger value="vehicles">All Vehicles</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Oil Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Search for a vehicle to view service history
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Database</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Search for a vehicle to get started
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
