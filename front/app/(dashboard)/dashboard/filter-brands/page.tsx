'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus } from 'lucide-react'

export default function FilterBrandsPage() {
  const [brands, setBrands] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingBrand, setEditingBrand] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [brandName, setBrandName] = useState('')

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/filter-brands')
      setBrands(response.data.data)
    } catch (error) {
      console.error('Failed to fetch filter brands:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandName.trim()) return

    try {
      setIsSaving(true)
      if (editingBrand) {
        await api.put(`/filter-brands/${editingBrand._id}`, { name: brandName })
        alert('Filter brand updated!')
      } else {
        await api.post('/filter-brands', { name: brandName })
        alert('Filter brand added!')
      }
      setBrandName('')
      setEditingBrand(null)
      setOpenDialog(false)
      fetchBrands()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save filter brand')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/filter-brands/${id}/toggle-status`)
      fetchBrands()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to toggle status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this filter brand?')) return
    try {
      await api.delete(`/filter-brands/${id}`)
      alert('Filter brand deleted!')
      fetchBrands()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete filter brand')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Filter Brands</h1>
          <p className="text-muted-foreground mt-1">Manage filter manufacturers</p>
        </div>
        <Button
          onClick={() => {
            setEditingBrand(null)
            setBrandName('')
            setOpenDialog(true)
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Filter Brands</CardTitle>
          <CardDescription>List of all filter manufacturers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : brands.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No filter brands found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <Card key={brand._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground">{brand.name}</h3>
                        <Badge
                          variant={brand.active ? 'default' : 'outline'}
                          className="mt-2 cursor-pointer"
                          onClick={() => handleToggleStatus(brand._id)}
                        >
                          {brand.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBrand(brand)
                          setBrandName(brand.name)
                          setOpenDialog(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(brand._id)}
                        className="text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Edit Filter Brand' : 'Add Filter Brand'}</DialogTitle>
            <DialogDescription>Enter the filter brand name</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Mann, Bosch, Mahle"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingBrand ? 'Update' : 'Add'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
