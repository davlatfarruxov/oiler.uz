'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppSelector } from '@/lib/store/hooks'
import { canShowSection, useCanShowSection } from '@/lib/uiPermissions'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Plus, AlertCircle, TrendingDown, Loader2, Pencil, Trash2, Printer } from 'lucide-react'
import style from 'styled-jsx/style'


export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [oilBrands, setOilBrands] = useState<any[]>([])
  const [filterBrands, setFilterBrands] = useState<any[]>([])
  const [filters, setFilters] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [selectedFilterBrand, setSelectedFilterBrand] = useState<string | null>(null)
  const [brandProducts, setBrandProducts] = useState<any[]>([])
  const [brandFilters, setBrandFilters] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [openBrandDialog, setOpenBrandDialog] = useState(false)
  const [openVariantDialog, setOpenVariantDialog] = useState(false)
  const [openFilterDialog, setOpenFilterDialog] = useState(false)
  const [showPriceLabel, setShowPriceLabel] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editingBrand, setEditingBrand] = useState<any>(null)
  const [editingVariant, setEditingVariant] = useState<any>(null)
  const [editingFilter, setEditingFilter] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newItem, setNewItem] = useState({
    productType: 'oil',
    name: '',
    costPrice: '',
    costCurrency: 'UZS' as 'USD' | 'UZS',
    price: '',
    stock: '',
    reorderLevel: '',
  })

  const [newBrand, setNewBrand] = useState({
    name: '',
    description: ''
  })

  const [newVariant, setNewVariant] = useState({
    viscosity: '',
    apiGrade: '',
    volume: '',
    costPrice: '',
    costCurrency: 'UZS' as 'USD' | 'UZS',
    price: '',
    stock: '',
    reorderLevel: '10'
  })

  const [newFilter, setNewFilter] = useState({
    brandName: '',
    filterType: 'oil_filter',
    partNumber: '',
    quality: '',
    compatibleVehicles: '',
    costPrice: '',
    costCurrency: 'USD' as 'USD' | 'UZS',
    price: '',
    stock: '',
    reorderLevel: '10'
  })

  useEffect(() => {
    fetchInventory()
    fetchOilBrands()
    fetchFilters()
    fetchSettings()
    fetchLowStock()
  }, [])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/inventory')
      setItems(response.data.data)
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOilBrands = async () => {
    try {
      const response = await api.get('/oil-brands')
      setOilBrands(response.data.data)
    } catch (error) {
      console.error('Failed to fetch oil brands:', error)
    }
  }

  const fetchFilterBrands = async () => {
    try {
      const response = await api.get('/filter-brands')
      setFilterBrands(response.data.data)
    } catch (error) {
      console.error('Failed to fetch filter brands:', error)
    }
  }

  const fetchFilters = async () => {
    try {
      const response = await api.get('/filters')
      setFilters(response.data.data)
    } catch (error) {
      console.error('Failed to fetch filters:', error)
    }
  }

  const fetchBrandFilters = async (brandName: string) => {
    try {
      const brandFiltersData = filters.filter(f => f.brandName === brandName)
      setBrandFilters(brandFiltersData)
    } catch (error) {
      console.error('Failed to fetch brand filters:', error)
      setBrandFilters([])
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings')
      setSettings(response.data.data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchBrandProducts = async (brandId: string) => {
    try {
      console.log('Fetching products for brand:', brandId)
      const response = await api.get(`/oil-products?brandId=${brandId}`)
      const products = response.data.data
      console.log('Brand products:', products)
      setBrandProducts(products)
    } catch (error: any) {
      console.error('Failed to fetch brand products:', error)
      console.error('Error details:', error.response?.data)
      setBrandProducts([])
    }
  }

  const fetchLowStock = async () => {
    try {
      const response = await api.get('/inventory/low-stock')
      setLowStockItems(response.data.data)
    } catch (error) {
      console.error('Failed to fetch low stock:', error)
    }
  }

  const getTotalInventoryValue = () => {
    return items.reduce((sum, item) => sum + item.price * item.stock, 0)
  }

  const getItemsByType = (type: string) => {
    return items.filter(item => item.productType === type)
  }

  const openAddDialog = (type: string) => {
    setEditingItem(null)
    setNewItem({
      productType: type,
      name: '',
      costPrice: '',
      costCurrency: 'UZS',
      price: '',
      stock: '',
      reorderLevel: ''
    })
    setOpenDialog(true)
  }

  const openEditDialog = (item: any) => {
    setEditingItem(item)
    setNewItem({
      productType: item.productType,
      name: item.name,
      costPrice: String(item.costPrice || ''),
      costCurrency: (item.costCurrency || 'UZS') as 'USD' | 'UZS',
      price: String(item.price),
      stock: String(item.stock),
      reorderLevel: String(item.reorderLevel)
    })
    setOpenDialog(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name || !newItem.price || !newItem.stock) return

    try {
      setIsSaving(true)

      const data = {
        productType: newItem.productType,
        name: newItem.name,
        costPrice: Number(newItem.costPrice) || 0,
        costCurrency: newItem.costCurrency,
        price: Number(newItem.price),
        stock: Number(newItem.stock),
        reorderLevel: Number(newItem.reorderLevel) || 0
      }

      if (editingItem) {
        await api.put(`/inventory/${editingItem._id}`, data)
        alert('Item updated successfully!')
      } else {
        await api.post('/inventory', data)
        alert('Item added successfully!')
      }

      setOpenDialog(false)
      fetchInventory()
      fetchLowStock()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await api.delete(`/inventory/${id}`)
      alert('Item deleted successfully!')
      fetchInventory()
      fetchLowStock()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete item')
    }
  }

  const openAddOilDialog = () => {
    setEditingOilProduct(null)
    setNewOilProduct({ brand: '', viscosity: '', apiGrade: '', volume: '', price: '', stock: '' })
    setOpenOilDialog(true)
  }

  const openEditOilDialog = (product: any) => {
    setEditingOilProduct(product)
    setNewOilProduct({
      brand: product.brand,
      viscosity: product.viscosity,
      apiGrade: product.apiGrade,
      volume: String(product.volume),
      price: String(product.price),
      stock: String(product.stock)
    })
    setOpenOilDialog(true)
  }

  const handleSaveOilProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)

      const data = {
        brand: newOilProduct.brand,
        viscosity: newOilProduct.viscosity,
        apiGrade: newOilProduct.apiGrade.toUpperCase(),
        volume: Number(newOilProduct.volume),
        price: Number(newOilProduct.price),
        stock: Number(newOilProduct.stock)
      }

      if (editingOilProduct) {
        await api.put(`/oil-products/${editingOilProduct._id}`, data)
        alert('Oil product updated successfully!')
      } else {
        await api.post('/oil-products', data)
        alert('Oil product added successfully!')
      }

      setOpenOilDialog(false)
      fetchOilProducts()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save oil product')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteOilProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this oil product?')) return

    try {
      await api.delete(`/oil-products/${id}`)
      alert('Oil product deleted successfully!')
      fetchOilProducts()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete oil product')
    }
  }

  // Brand functions
  const openAddBrandDialog = () => {
    setEditingBrand(null)
    setNewBrand({ name: '', description: '' })
    setOpenBrandDialog(true)
  }

  const openEditBrandDialog = (brand: any) => {
    setEditingBrand(brand)
    setNewBrand({ name: brand.name, description: brand.description || '' })
    setOpenBrandDialog(true)
  }

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)

      if (editingBrand) {
        await api.put(`/oil-brands/${editingBrand._id}`, newBrand)
        alert('Brand updated successfully!')
      } else {
        await api.post('/oil-brands', newBrand)
        alert('Brand added successfully!')
      }

      setOpenBrandDialog(false)
      fetchOilBrands()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save brand')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBrand = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return

    try {
      await api.delete(`/oil-brands/${id}`)
      alert('Brand deleted successfully!')
      fetchOilBrands()
      if (selectedBrand?._id === id) {
        setSelectedBrand(null)
        setBrandProducts([])
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete brand')
    }
  }

  const handleSelectBrand = (brand: any) => {
    setSelectedBrand(brand)
    fetchBrandProducts(brand._id)
  }

  // Variant functions
  const openAddVariantDialog = () => {
    if (!selectedBrand) {
      alert('Please select a brand first')
      return
    }
    setEditingVariant(null)
    setNewVariant({
      viscosity: '',
      apiGrade: '',
      volume: '',
      costPrice: '',
      costCurrency: 'UZS' as 'USD' | 'UZS',
      price: '',
      stock: '',
      reorderLevel: '10'
    })
    setOpenVariantDialog(true)
  }

  const openEditVariantDialog = (variant: any) => {
    setEditingVariant(variant)
    setNewVariant({
      viscosity: variant.viscosity || '',
      apiGrade: variant.apiGrade || '',
      volume: String(variant.volume || ''),
      costPrice: String(variant.costPrice || ''),
      costCurrency: (variant.costCurrency || 'UZS') as 'USD' | 'UZS',
      price: String(variant.price || ''),
      stock: String(variant.stock || ''),
      reorderLevel: String(variant.reorderLevel || 10)
    })
    setOpenVariantDialog(true)
  }

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)

      const data = {
        brandId: selectedBrand._id,
        viscosity: newVariant.viscosity,
        apiGrade: newVariant.apiGrade.toUpperCase(),
        volume: Number(newVariant.volume),
        costPrice: Number(newVariant.costPrice),
        costCurrency: newVariant.costCurrency,
        price: Number(newVariant.price),
        stock: Number(newVariant.stock),
        reorderLevel: Number(newVariant.reorderLevel) || 10
      }

      if (editingVariant) {
        await api.put(`/oil-products/${editingVariant._id}`, data)
        alert('Variant updated successfully!')
      } else {
        await api.post('/oil-products', data)
        alert('Variant added successfully!')
      }

      setOpenVariantDialog(false)
      fetchBrandProducts(selectedBrand._id)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save variant')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteVariant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return

    try {
      await api.delete(`/oil-products/${id}`)
      alert('Variant deleted successfully!')
      fetchBrandProducts(selectedBrand._id)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete variant')
    }
  }

  const handleSaveFilter = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)

      const vehiclesArray = newFilter.compatibleVehicles
        .split(',')
        .map(v => v.trim())
        .filter(v => v)

      const data = {
        brandName: newFilter.brandName,
        filterType: newFilter.filterType,
        partNumber: newFilter.partNumber,
        quality: newFilter.quality,
        compatibleVehicles: vehiclesArray,
        costPrice: Number(newFilter.costPrice),
        costCurrency: newFilter.costCurrency,
        price: Number(newFilter.price),
        stock: Number(newFilter.stock),
        reorderLevel: Number(newFilter.reorderLevel)
      }

      if (editingFilter) {
        await api.put(`/filters/${editingFilter._id}`, data)
        alert('Filter updated successfully!')
      } else {
        await api.post('/filters', data)
        alert('Filter added successfully!')
      }

      setOpenFilterDialog(false)
      fetchFilters()
      fetchLowStock()
      if (selectedFilterBrand) {
        fetchBrandFilters(selectedFilterBrand)
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save filter')
    } finally {
      setIsSaving(false)
    }
  }

  const oils = getItemsByType('oil')
  const products = getItemsByType('other')

  const permissions = useAppSelector((s) => s.auth.user?.permissions)
  const can = useCanShowSection()
  const showOilTab = can('ui.inventory.tab_oil')
  const showFiltersTab = can('ui.inventory.tab_filters')
  const showProductsTab = can('ui.inventory.tab_products')
  const defaultInvTab = useMemo(() => {
    if (canShowSection(permissions, 'ui.inventory.tab_oil')) return 'oil-products'
    if (canShowSection(permissions, 'ui.inventory.tab_filters')) return 'filters'
    if (canShowSection(permissions, 'ui.inventory.tab_products')) return 'products'
    return 'oil-products'
  }, [permissions])
  const hasInvTab = showOilTab || showFiltersTab || showProductsTab

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ombor boshqaruvi</h1>
          <p className="text-muted-foreground mt-1">Moylar, filterlar va mahsulotlarni boshqarish</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Jami ombor qiymati</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-foreground mt-2">${getTotalInventoryValue().toLocaleString()}</p>
                )}
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingDown className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Jami mahsulotlar</p>
                <p className="text-2xl font-bold text-foreground mt-2">{items.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {can('ui.inventory.low_stock_alert') && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Kam qolgan mahsulotlar</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-500 mt-2">{lowStockItems.length}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {can('ui.inventory.low_stock_alert') && lowStockItems.length > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Kam qolgan mahsulotlar ogohlantirishi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item: any) => (
                <p key={item._id} className="text-sm text-foreground">
                  <strong>{item.name}</strong> - Faqat {item.stock} dona qoldi (qayta buyurtma: {item.reorderLevel})
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ombor</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasInvTab ? (
            <p className="text-center text-muted-foreground py-8">
              Ombor varaqlarini ko‘rish uchun rolga tegishli UI ruxsatlari berilmagan.
            </p>
          ) : (
          <Tabs defaultValue={defaultInvTab} className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1">
              {showOilTab && (
              <TabsTrigger value="oil-products">Moy mahsulotlari ({oilBrands.length} brend)</TabsTrigger>
              )}
              {showFiltersTab && (
              <TabsTrigger value="filters">Filterlar ({Array.from(new Set(filters.map(f => f.brandName))).length} brend)</TabsTrigger>
              )}
              {showProductsTab && (
              <TabsTrigger value="products">Mahsulotlar ({products.length})</TabsTrigger>
              )}
            </TabsList>

            {showOilTab && (
            <TabsContent value="oil-products" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Brands list */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Brendlar</CardTitle>
                      <Button size="sm" onClick={openAddBrandDialog}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : oilBrands.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Hali brendlar yo'q</p>
                    ) : (
                      <div className="space-y-2">
                        {oilBrands.map((brand) => (
                          <div
                            key={brand._id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedBrand?._id === brand._id
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'hover:bg-muted'
                              }`}
                            onClick={() => handleSelectBrand(brand)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{brand.name}</span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditBrandDialog(brand)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteBrand(brand._id)
                                  }}
                                  className="h-6 w-6 p-0 text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Variants list */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {selectedBrand ? `${selectedBrand.name} Variants` : 'Select a brand'}
                      </CardTitle>
                      {selectedBrand && (
                        <Button size="sm" onClick={openAddVariantDialog}>
                          <Plus className="w-3 h-3 mr-1" />
                          Variant qo'shish
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!selectedBrand ? (
                      <p className="text-center text-muted-foreground py-8">Variantlarni ko'rish uchun brendni tanlang</p>
                    ) : brandProducts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Hali variantlar yo'q. Birinchi variantni qo'shing!</p>
                    ) : (
                      <div className="space-y-3">
                        {brandProducts.map((product) => {
                          // Calculate cost in UZS
                          const costPrice = product.costPrice || 0;
                          const costCurrency = product.costCurrency || 'UZS';
                          const exchangeRate = product.exchangeRateUsed || 1;
                          const costInUZS = costCurrency === 'USD'
                            ? costPrice * exchangeRate
                            : costPrice;
                          const salePrice = product.price || 0;
                          const profit = salePrice - costInUZS;
                          const profitPercent = costInUZS > 0 ? ((profit / costInUZS) * 100).toFixed(1) : '0';

                          return (
                            <div key={product._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold">{product.viscosity} {product.apiGrade}</span>
                                    <Badge variant="outline">{product.volume}L</Badge>
                                    <Badge variant={product.stock <= product.reorderLevel ? 'destructive' : 'default'}>
                                      {product.stock} units
                                    </Badge>
                                  </div>
                                  <div className="space-y-1">
                                    {costPrice > 0 && (
                                      <>
                                        <p className="text-sm text-muted-foreground">
                                          Cost: {costPrice.toLocaleString()} {costCurrency}
                                          {costCurrency === 'USD' && ` (${costInUZS.toLocaleString()} UZS)`}
                                        </p>
                                        <p className="text-lg font-bold text-primary">
                                          Sale: {salePrice.toLocaleString()} UZS
                                        </p>
                                        <p className={`text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          Profit: {profit.toLocaleString()} UZS ({profitPercent}%)
                                        </p>
                                      </>
                                    )}
                                    {!costPrice && (
                                      <p className="text-lg font-bold text-primary">
                                        Price: {salePrice.toLocaleString()} UZS
                                      </p>
                                    )}
                                  </div>
                                  {product.stock <= product.reorderLevel && (
                                    <p className="text-xs text-destructive mt-1">⚠️ Low stock! Reorder at {product.reorderLevel}</p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedProduct({
                                        type: 'oil',
                                        name: `${selectedBrand.name} ${product.viscosity} ${product.apiGrade} ${product.volume}L`,
                                        price: product.price
                                      })
                                      setShowPriceLabel(true)
                                    }}
                                    title="Print Price Label"
                                  >
                                    <Printer className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => openEditVariantDialog(product)}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteVariant(product._id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            )}

            {showFiltersTab && (
            <TabsContent value="filters" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filter Brands list */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Filter brendlari</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : (() => {
                      const uniqueBrands = Array.from(new Set(filters.map(f => f.brandName))).sort()
                      return uniqueBrands.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Hali filterlar yo'q</p>
                      ) : (
                        <div className="space-y-2">
                          {uniqueBrands.map((brandName) => {
                            const brandFilterCount = filters.filter(f => f.brandName === brandName).length
                            return (
                              <div
                                key={brandName}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedFilterBrand === brandName
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'hover:bg-muted'
                                  }`}
                                onClick={() => {
                                  setSelectedFilterBrand(brandName)
                                  fetchBrandFilters(brandName)
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold">{brandName}</span>
                                  <Badge variant="outline">{brandFilterCount}</Badge>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>

                {/* Filters list */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {selectedFilterBrand ? `${selectedFilterBrand} Filters` : 'Select a brand'}
                      </CardTitle>
                      <Button size="sm" onClick={() => {
                        setEditingFilter(null)
                        setNewFilter({
                          brandName: selectedFilterBrand || '',
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
                        setOpenFilterDialog(true)
                      }}>
                        <Plus className="w-3 h-3 mr-1" />
                        Filter qo'shish
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!selectedFilterBrand ? (
                      <p className="text-center text-muted-foreground py-8">Filterlarni ko'rish uchun brendni tanlang</p>
                    ) : brandFilters.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Hali filterlar yo'q. Birinchi filterni qo'shing!</p>
                    ) : (
                      <div className="space-y-3">
                        {brandFilters.map((filter) => {
                          const costPrice = filter.costPrice || 0
                          const costCurrency = filter.costCurrency || 'UZS'
                          const exchangeRate = filter.exchangeRateUsed || 1
                          const costInUZS = costCurrency === 'USD' ? costPrice * exchangeRate : costPrice
                          const salePrice = filter.price || 0
                          const profit = salePrice - costInUZS
                          const profitPercent = costInUZS > 0 ? ((profit / costInUZS) * 100).toFixed(1) : '0'

                          const filterTypeLabels: any = {
                            oil_filter: 'Moy filteri',
                            air_filter: 'Havo filteri',
                            cabin_filter: 'Salon filteri',
                            fuel_filter: 'Yoqilg\'i filteri'
                          }

                          return (
                            <div key={filter._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold">{filter.partNumber}</span>
                                    <Badge variant="outline">{filterTypeLabels[filter.filterType]}</Badge>
                                    <Badge variant="secondary">{filter.quality}</Badge>
                                    <Badge variant={filter.stock <= filter.reorderLevel ? 'destructive' : 'default'}>
                                      {filter.stock} units
                                    </Badge>
                                  </div>
                                  {filter.compatibleVehicles && filter.compatibleVehicles.length > 0 && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                      Mos keladi: {filter.compatibleVehicles.join(', ')}
                                    </p>
                                  )}
                                  <div className="space-y-1">
                                    {costPrice > 0 && (
                                      <>
                                        <p className="text-sm text-muted-foreground">
                                          Cost: {costPrice.toLocaleString()} {costCurrency}
                                          {costCurrency === 'USD' && ` (${costInUZS.toLocaleString()} UZS)`}
                                        </p>
                                        <p className="text-lg font-bold text-primary">
                                          Sale: {salePrice.toLocaleString()} UZS
                                        </p>
                                        <p className={`text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          Profit: {profit.toLocaleString()} UZS ({profitPercent}%)
                                        </p>
                                      </>
                                    )}
                                    {!costPrice && (
                                      <p className="text-lg font-bold text-primary">
                                        Price: {salePrice.toLocaleString()} UZS
                                      </p>
                                    )}
                                  </div>
                                  {filter.stock <= filter.reorderLevel && (
                                    <p className="text-xs text-destructive mt-1">⚠️ Low stock! Reorder at {filter.reorderLevel}</p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const filterTypeLabels: any = {
                                        oil_filter: 'Oil Filter',
                                        air_filter: 'Air Filter',
                                        cabin_filter: 'Cabin Filter',
                                        fuel_filter: 'Fuel Filter'
                                      }
                                      setSelectedProduct({
                                        type: 'filter',
                                        name: `${filter.brandName} ${filter.partNumber} ${filterTypeLabels[filter.filterType]}`,
                                        price: filter.price,
                                        compatibleVehicles: filter.compatibleVehicles || []
                                      })
                                      setShowPriceLabel(true)
                                    }}
                                    title="Print Price Label"
                                  >
                                    <Printer className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    setEditingFilter(filter)
                                    setNewFilter({
                                      brandName: filter.brandName,
                                      filterType: filter.filterType,
                                      partNumber: filter.partNumber,
                                      quality: filter.quality,
                                      compatibleVehicles: filter.compatibleVehicles?.join(', ') || '',
                                      costPrice: String(filter.costPrice || ''),
                                      costCurrency: filter.costCurrency || 'USD',
                                      price: String(filter.price || ''),
                                      stock: String(filter.stock || ''),
                                      reorderLevel: String(filter.reorderLevel || 10)
                                    })
                                    setOpenFilterDialog(true)
                                  }}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      if (!confirm('Are you sure you want to delete this filter?')) return
                                      try {
                                        await api.delete(`/filters/${filter._id}`)
                                        alert('Filter deleted successfully!')
                                        fetchFilters()
                                        fetchBrandFilters(selectedFilterBrand)
                                      } catch (error: any) {
                                        alert(error.response?.data?.message || 'Failed to delete filter')
                                      }
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            )}

            {showProductsTab && (
            <TabsContent value="products" className="space-y-4">
              <Button onClick={() => openAddDialog('other')} className="gap-2 mb-4">
                <Plus className="w-4 h-4" />
                Mahsulot qo'shish
              </Button>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <InventoryTable
                  items={products}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteItem}
                  showReorderLevel={true}
                  usdToUzsRate={Number(settings?.exchangeRate) > 0 ? Number(settings.exchangeRate) : 12500}
                />
              )}
            </TabsContent>
            )}
          </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}</DialogTitle>
            <DialogDescription>Ombor mahsuloti ma'lumotlarini yangilash</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div>
              <Label htmlFor="name">Mahsulot nomi *</Label>
              <Input
                id="name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="costPrice">Sotib olish narxi</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={newItem.costPrice}
                  onChange={(e) => setNewItem({ ...newItem, costPrice: e.target.value })}
                  placeholder="25000"
                />
              </div>
              <div>
                <Label htmlFor="costCurrency">Valyuta</Label>
                <Select
                  value={newItem.costCurrency}
                  onValueChange={(value: 'USD' | 'UZS') => setNewItem({ ...newItem, costCurrency: value })}
                >
                  <SelectTrigger id="costCurrency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UZS">UZS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Sotish narxi (UZS) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="stock">Omborda *</Label>
              <Input
                id="stock"
                type="number"
                value={newItem.stock}
                onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="reorder">Qayta buyurtma darajasi</Label>
              <Input
                id="reorder"
                type="number"
                value={newItem.reorderLevel}
                onChange={(e) => setNewItem({ ...newItem, reorderLevel: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  editingItem ? 'Yangilash' : 'Qo\'shish'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Bekor qilish
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openBrandDialog} onOpenChange={setOpenBrandDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Brendni tahrirlash' : 'Brend qo\'shish'}</DialogTitle>
            <DialogDescription>Brend ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveBrand} className="space-y-4">
            <div>
              <Label htmlFor="brandName">Brend nomi *</Label>
              <Input
                id="brandName"
                value={newBrand.name}
                onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                placeholder="Aisin, Mobil, Shell..."
                required
              />
            </div>
            <div>
              <Label htmlFor="brandDesc">Tavsif (Ixtiyoriy)</Label>
              <Input
                id="brandDesc"
                value={newBrand.description}
                onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                placeholder="Yuqori sifatli moy..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  editingBrand ? 'Brendni yangilash' : 'Brend qo\'shish'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenBrandDialog(false)}>
                Bekor qilish
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openVariantDialog} onOpenChange={setOpenVariantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? 'Variantni tahrirlash' : `${selectedBrand?.name} uchun variant qo'shish`}
            </DialogTitle>
            <DialogDescription>Variant xususiyatlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveVariant} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="viscosity">Qovushqoqlik *</Label>
                <Input
                  id="viscosity"
                  value={newVariant.viscosity}
                  onChange={(e) => setNewVariant({ ...newVariant, viscosity: e.target.value })}
                  placeholder="10W-40, 5W-30..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="apiGrade">API daraja *</Label>
                <Input
                  id="apiGrade"
                  value={newVariant.apiGrade}
                  onChange={(e) => setNewVariant({ ...newVariant, apiGrade: e.target.value.toUpperCase() })}
                  placeholder="SN, SL, SP..."
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="volume">Hajm (Litr) *</Label>
                <Input
                  id="volume"
                  type="number"
                  step="0.5"
                  value={newVariant.volume}
                  onChange={(e) => setNewVariant({ ...newVariant, volume: e.target.value })}
                  placeholder="4"
                  required
                />
              </div>
              <div>
                <Label htmlFor="variantStock">Omborda *</Label>
                <Input
                  id="variantStock"
                  type="number"
                  value={newVariant.stock}
                  onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                  placeholder="50"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="costPrice">Xarajat narxi *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={newVariant.costPrice}
                  onChange={(e) => setNewVariant({ ...newVariant, costPrice: e.target.value })}
                  placeholder="25000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="costCurrency">Valyuta *</Label>
                <Select value={newVariant.costCurrency} onValueChange={(value) => setNewVariant({ ...newVariant, costCurrency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UZS">UZS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="variantPrice">Sotish narxi (UZS) *</Label>
                <Input
                  id="variantPrice"
                  type="number"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                  placeholder="30000"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reorderLevel">Qayta buyurtma darajasi</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={newVariant.reorderLevel}
                  onChange={(e) => setNewVariant({ ...newVariant, reorderLevel: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  editingVariant ? 'Variantni yangilash' : 'Variant qo\'shish'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenVariantDialog(false)}>
                Bekor qilish
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={openFilterDialog} onOpenChange={setOpenFilterDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFilter ? 'Filterni tahrirlash' : 'Yangi filter qo\'shish'}</DialogTitle>
            <DialogDescription>Filter ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveFilter} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Brend *</Label>
                <Input
                  value={newFilter.brandName}
                  onChange={(e) => setNewFilter({ ...newFilter, brandName: e.target.value })}
                  placeholder="Mann, Bosch, Mahle"
                  required
                />
              </div>
              <div>
                <Label>Filter turi *</Label>
                <Select value={newFilter.filterType} onValueChange={(value) => setNewFilter({ ...newFilter, filterType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oil_filter">Moy filteri</SelectItem>
                    <SelectItem value="air_filter">Havo filteri</SelectItem>
                    <SelectItem value="cabin_filter">Salon filteri</SelectItem>
                    <SelectItem value="fuel_filter">Yoqilg'i filteri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Qism raqami *</Label>
                <Input value={newFilter.partNumber} onChange={(e) => setNewFilter({ ...newFilter, partNumber: e.target.value })} placeholder="W 712/75" required />
              </div>
              <div>
                <Label>Sifat *</Label>
                <Input value={newFilter.quality} onChange={(e) => setNewFilter({ ...newFilter, quality: e.target.value })} placeholder="Premium, Standart, Ekonom" required />
              </div>
            </div>

            <div>
              <Label>Mos keladigan mashinalar</Label>
              <Input value={newFilter.compatibleVehicles} onChange={(e) => setNewFilter({ ...newFilter, compatibleVehicles: e.target.value })} placeholder="Toyota Camry, Honda Accord" />
              <p className="text-xs text-muted-foreground mt-1">Vergul bilan ajratilgan</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Xarajat narxi *</Label>
                <Input type="number" step="0.01" value={newFilter.costPrice} onChange={(e) => setNewFilter({ ...newFilter, costPrice: e.target.value })} required />
              </div>
              <div>
                <Label>Valyuta *</Label>
                <Select value={newFilter.costCurrency} onValueChange={(value: 'USD' | 'UZS') => setNewFilter({ ...newFilter, costCurrency: value })}>
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
                <Label>Sotish narxi (UZS) *</Label>
                <Input type="number" value={newFilter.price} onChange={(e) => setNewFilter({ ...newFilter, price: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Omborda *</Label>
                <Input type="number" value={newFilter.stock} onChange={(e) => setNewFilter({ ...newFilter, stock: e.target.value })} required />
              </div>
              <div>
                <Label>Qayta buyurtma darajasi</Label>
                <Input type="number" value={newFilter.reorderLevel} onChange={(e) => setNewFilter({ ...newFilter, reorderLevel: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saqlanmoqda...</> : (editingFilter ? 'Yangilash' : 'Qo\'shish')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenFilterDialog(false)}>Bekor qilish</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Price Label Dialog */}
      <Dialog open={showPriceLabel} onOpenChange={setShowPriceLabel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Price Label</DialogTitle>
            <DialogDescription>Print price label for product</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Label Preview */}
            <div className="border-2  border-gray-300 p-4 bg-gray-50">
              <div className="price-label-print">
                <div style={{
                  
                  
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '23px',
                    
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}>
                    MOTORLAB.UZ
                  </div>
                </div>

                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '2mm',
                  paddingTop: '0',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  lineHeight: '1.3'
                }}>
                  {selectedProduct?.name}
                </div>

                {selectedProduct?.compatibleVehicles && selectedProduct.compatibleVehicles.length > 0 && (
                  <div style={{
                    textAlign: 'center',
                    fontSize: '18px',
                    padding: '1mm',
                    paddingTop: '0',
                    fontWeight: 'bold',
                    lineHeight: '1.2',
                    color: '#333'
                  }}>
                    {selectedProduct.compatibleVehicles.join(', ')}
                  </div>
                )}

                <div style={{
                  border: '2px solid #000',
                  paddingTop: '2mm',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '8px', fontWeight: '600', marginBottom: '1mm' }}></div>
                  <div style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: '1' }}>
                    {selectedProduct?.price?.toLocaleString()}<div style={{ fontSize: '10px', fontWeight: '600'}}>so'm</div>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Print Button */}
            <div className="flex gap-2">
              <Button onClick={() => window.print()} className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Print Label
              </Button>
              <Button variant="outline" onClick={() => setShowPriceLabel(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .price-label-print {
            width: 58mm;
            height: 40mm;
            display: flex;
            flex-direction: column;
            padding: 3mm;
            font-family: Arial, sans-serif;
            background-color: white;
           
            box-sizing: border-box;
          }
          
          @media print {
            body * {
              visibility: hidden !important;
            }
            .price-label-print,
            .price-label-print * {
              visibility: visible !important;
            }
            .price-label-print {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 58mm !important;
              height: 40mm !important;
              display: flex !important;
              flex-direction: column !important;
              margin-top: 25px;
              padding: 3mm !important;
              font-family: Arial, sans-serif !important;
              background-color: white !important;
              box-sizing: border-box !important;
            }
            @page {
              size: 58mm 40mm;
              margin: 0;
            }
          }
        `
      }} />
    </div>
  )
}

function InventoryTable({
  items,
  onEdit,
  onDelete,
  showReorderLevel = true,
  usdToUzsRate = 12500
}: any) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No items found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Product Name</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Price</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Stock</th>
            {showReorderLevel && <th className="text-left py-3 px-4 font-semibold text-foreground">Reorder Level</th>}
            <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => (
            <tr key={item._id} className="border-b border-border hover:bg-muted/50 transition-colors">
              <td className="py-3 px-4 font-semibold text-foreground">{item.name}</td>
              <td className="py-3 px-4 text-foreground">
                {(() => {
                  const costPrice = item.costPrice || 0
                  const costCurrency = item.costCurrency || 'UZS'
                  const conversionRate =
                    typeof item.exchangeRateUsed === 'number' && item.exchangeRateUsed > 0
                      ? item.exchangeRateUsed
                      : Number(usdToUzsRate) > 0
                        ? Number(usdToUzsRate)
                        : 12500
                  const costInUZS =
                    costCurrency === 'USD' ? costPrice * conversionRate : costPrice
                  const salePrice = item.price || 0
                  const profit = salePrice - costInUZS
                  const profitPercent = costInUZS > 0 ? ((profit / costInUZS) * 100).toFixed(1) : '0'

                  return (
                    <>
                      <div className="font-medium">{salePrice.toLocaleString()} UZS</div>
                      {costPrice > 0 && (
                        <>
                          <div className="text-xs text-muted-foreground">
                            Cost: {costPrice.toLocaleString()} {costCurrency}
                            {costCurrency === 'USD' && ` (${costInUZS.toLocaleString()} UZS)`}
                          </div>
                          <div className={`text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? 'Foyda' : 'Zarar'}: {profit.toLocaleString()} UZS ({profitPercent}%)
                          </div>
                        </>
                      )}
                    </>
                  )
                })()}
              </td>
              <td className="py-3 px-4 text-foreground">{item.stock} units</td>
              {showReorderLevel && <td className="py-3 px-4 text-muted-foreground">{item.reorderLevel} units</td>}
              <td className="py-3 px-4">
                {item.stock <= item.reorderLevel ? (
                  <Badge variant="destructive">Low Stock</Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-900 border-green-200">
                    In Stock
                  </Badge>
                )}
              </td>
              <td className="py-3 px-4 space-x-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(item._id)} className="text-destructive">
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
