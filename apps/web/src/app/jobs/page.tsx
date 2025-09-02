'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Eye,
  Users,
  Filter,
  Briefcase
} from 'lucide-react'
import { jobsApi } from '@/lib/api'
import { JOB_CATEGORIES, JOB_TALENT_TYPES, TURKISH_CITIES } from '@/lib/constants'
import Link from 'next/link'

interface JobPost {
  id: string
  title: string
  description: string
  category: string
  talentType: string
  location: string
  budgetMin?: number
  budgetMax?: number
  currency: string
  applicationDeadline: string
  isUrgent: boolean
  isFeatured: boolean
  views: number
  applicationCount: number
  publishedAt: string
  images: string[]
  agency: {
    companyName: string
    logo?: string
    isVerified: boolean
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    talentType: '',
    location: '',
    isUrgent: false,
    isFeatured: false
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [filters])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        search: searchTerm || undefined,
        ...filters,
        isUrgent: filters.isUrgent || undefined,
        isFeatured: filters.isFeatured || undefined
      }

      // Remove empty values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === false) {
          delete params[key]
        }
      })

      const response = await jobsApi.getJobPosts(params)
      setJobs(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'İlanlar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchJobs()
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      talentType: '',
      location: '',
      isUrgent: false,
      isFeatured: false
    })
    setSearchTerm('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR')
  }

  const getTimeLeft = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Süresi dolmuş'
    if (diffDays === 0) return 'Bugün sona eriyor'
    if (diffDays === 1) return 'Yarın sona eriyor'
    return `${diffDays} gün kaldı`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">İlanlar yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">İş İlanları</h1>
          <p className="text-lg text-gray-600">
            Size uygun casting ve proje fırsatlarını keşfedin
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="İlan başlığı, açıklama ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} className="px-8">
                  Ara
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtrele
                </Button>
                {(Object.values(filters).some(Boolean) || searchTerm) && (
                  <Button variant="outline" onClick={clearFilters}>
                    Temizle
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Tümü</option>
                    {JOB_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yetenek Türü
                  </label>
                  <select
                    value={filters.talentType}
                    onChange={(e) => handleFilterChange('talentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Tümü</option>
                    {JOB_TALENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şehir
                  </label>
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Tümü</option>
                    {TURKISH_CITIES.map(city => (
                      <option key={city.value} value={city.value}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isUrgent}
                      onChange={(e) => handleFilterChange('isUrgent', e.target.checked)}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm text-gray-700">Acil</span>
                  </label>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isFeatured}
                      onChange={(e) => handleFilterChange('isFeatured', e.target.checked)}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm text-gray-700">Öne Çıkan</span>
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center text-red-600">
              {error}
            </CardContent>
          </Card>
        )}

        {jobs.length === 0 && !loading && !error && (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                İlan bulunamadı
              </h3>
              <p className="text-gray-600">
                Arama kriterlerinize uygun ilan bulunamadı. Filtreleri değiştirmeyi deneyin.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Job Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {job.isFeatured && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Öne Çıkan
                        </Badge>
                      )}
                      {job.isUrgent && (
                        <Badge variant="destructive">
                          Acil
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight mb-2">
                      <Link 
                        href={`/jobs/${job.id}`}
                        className="hover:text-brand-primary transition-colors"
                      >
                        {job.title}
                      </Link>
                    </CardTitle>
                    <div className="text-sm text-gray-600">
                      {job.agency.companyName}
                      {job.agency.isVerified && (
                        <Badge className="ml-2 text-xs bg-green-100 text-green-800">
                          Doğrulanmış
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {job.description.substring(0, 150)}...
                </p>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{getTimeLeft(job.applicationDeadline)}</span>
                  </div>
                  
                  {(job.budgetMin || job.budgetMax) && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {job.budgetMin && job.budgetMax
                          ? `${job.budgetMin}-${job.budgetMax} ${job.currency}`
                          : job.budgetMin
                          ? `${job.budgetMin}+ ${job.currency}`
                          : `${job.budgetMax} ${job.currency}'ye kadar`
                        }
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{job.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{job.applicationCount} başvuru</span>
                    </div>
                  </div>
                  
                  <Link href={`/jobs/${job.id}`}>
                    <Button size="sm">
                      Detayları Gör
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
