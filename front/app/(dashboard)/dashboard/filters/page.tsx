'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Package } from 'lucide-react'

const FILTER_TYPES = [
  { value: 'oil_filter', label: 'Oil Filter' },
  { value: 'air_filter', label: 'Air Filter' },
  { value: 'cabin_filter', label: 'Cabin Filter' },
  { value: 'fuel_filter', label: 'Fuel Filter' }
]

export default function FiltersPage() {
  const [filters, setFilters] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingFilter, setEditingFilter] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    brandId: '',
    filterType: 'oil_filter',
    partNumber: '',
    quality: '',
    compatibleVehicles: '',
    costPrice: '',
    costCurrency: 'USD',
    price: '',
    stock: '',
    reorderLevel: '10'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [filtersRes, brandsRes, settingsRes] = await Promise.all([
        api.get('/filters'),
        api.get('/filter-brands?activeOnly=true'),
        api.get('/settings')
      ])
      setFilters(filtersRes.data.data)
      setBrands(brandsRes.data.data)
      setSettings(settingsRes.data.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculatePrice = () => {
    if (!formData.costPrice || !settings) return 0
    const cost = Number(formData.costPrice)
    if (formData.costCurrency === 'USD') {
      return cost * settings.exchangeRate
    }
    return cost
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)
      const vehiclesArray = formData.compatibleVehicles
        .split(',')
        .map(v => v.trim())
        .filter(v => v)

      const data = {
        brandId: formData.brandId,
        filterType: formData.filterType,
        partNumber: formData.partNumber,
        quality: formData.quality,
        compatibleVehicles: vehiclesArray,
        costPrice: Number(formData.costPrice),
        costCurrency: formData.costCurrency,
        price: Number(formData.price) || calculatePrice(),
        stock: Number(formData.stock),
        reorderLevel: Number(formData.reorderLevel)
      }

      if (editingFilter) {
        await api.put(`/filters/${editingFilter._id}`, data)
        alert('Filter updated!')
      } else {
        await api.post('/filters', data)
        alert('Filter added!')
      }

      resetForm()
      setOpenDialog(false)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save filter')
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      brandId: '',
      filterType: 'oil_filter',
      partNumber: '',
      quality: '',
      compatibleVehicles: '',
      costPrice: '',
      costCurrency: 'USD',
      price: '',
      stock: '',
      reorderLevel: '10'
    })
    setEditingFilter(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await api.delete(`/filters/${id}`)
      alert('Filter deleted!')
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete')
    }
  }

  const lowStockFilters = filters.filter(f => f.stock <= f.reorderLevel)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Filters</h1>
          <p className="text-muted-foreground mt-1">Manage filter inventory</p>
        </div>
        <Button onClick={() => { resetForm(); setOpenDialog(true) }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Filter
        </Button>
      </div>

      {lowStockFilters.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">Low Stock Alert</CardTitle>
            <CardDescription className="text-orange-700">
              {lowStockFilters.length} filter(s) need reordering
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Filters ({filters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filters.map((filter) => (
                <div key={filter._id} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">{filter.displayName}</h3>
                        <Badge variant="outline">{filter.filterType.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Stock: {filter.stock} • Price: ${filter.price}
                      </p>
                      {filter.compatibleVehicles.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Fits: {filter.compatibleVehicles.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingFilter(filter)
                        setFormData({
                          brandId: filter.brandId,
                          filterType: filter.filterType,
                          partNumber: filter.partNumber,
                          quality: filter.quality,
                          compatibleVehicles: filter.compatibleVehicles.join(', '),
                          costPrice: filter.costPrice.toString(),
                          costCurrency: filter.costCurrency,
                          price: filter.price.toString(),
                          stock: filter.stock.toString(),
                          reorderLevel: filter.reorderLevel.toString()
                        })
                        setOpenDialog(true)
                      }}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(filter._id)} className="text-destructive">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFilter ? 'Edit Filter' : 'Add New Filter'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Brand *</Label>
                <Select value={formData.brandId} onValueChange={(value) => setFormData({ ...formData, brandId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand._id} value={brand._id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Filter Type *</Label>
                <Select value={formData.filterType} onValueChange={(value) => setFormData({ ...formData, filterType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Part Number *</Label>
                <Input value={formData.partNumber} onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })} required />
              </div>
              <div>
                <Label>Quality *</Label>
                <Input placeholder="Premium, Standard, Economy" value={formData.quality} onChange={(e) => setFormData({ ...formData, quality: e.target.value })} required />
              </div>
            </div>

            <div>
              <Label>Compatible Vehicles</Label>
              <Input placeholder="Toyota Camry, Honda Accord, Nissan Altima" value={formData.compatibleVehicles} onChange={(e) => setFormData({ ...formData, compatibleVehicles: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Comma-separated list</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Cost Price *</Label>
                <Input type="number" step="0.01" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} required />
              </div>
              <div>
                <Label>Currency *</Label>
                <Select value={formData.costCurrency} onValueChange={(value) => setFormData({ ...formData, costCurrency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="UZS">UZS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sale Price (UZS) *</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder={calculatePrice().toString()} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stock *</Label>
                <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required />
              </div>
              <div>
                <Label>Reorder Level</Label>
                <Input type="number" value={formData.reorderLevel} onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : (editingFilter ? 'Update' : 'Add')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
