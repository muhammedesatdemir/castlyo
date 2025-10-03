'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter,
  Briefcase,
  Plus
} from 'lucide-react'
import { JOB_CATEGORIES, JOB_TALENT_TYPES, TURKISH_CITIES } from '@/lib/constants'
import { useJobs } from '@/hooks/useJobs'
import { useUserFlags } from '@/hooks/useUserFlags'
import { JobCard } from '@/components/jobs/JobCard'
import { JobsPagination } from '@/components/jobs/JobsPagination'
import { JobsSkeleton } from '@/components/jobs/JobsSkeleton'
import Link from 'next/link'

export default function JobsPage() {
  const { jobs, meta, loading, error, currentParams, updateParams, clearFilters } = useJobs()
  const { userFlags, isVisitor, canPostJobs } = useUserFlags()
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState(currentParams.q || '')

  const handleSearch = () => {
    updateParams({ q: searchTerm })
  }

  const handleFilterChange = (key: string, value: any) => {
    updateParams({ [key]: value })
  }

  const handlePageChange = (page: number) => {
    updateParams({ page })
  }

  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">İş İlanları</h1>
            <p className="text-lg text-gray-600">
              Size uygun casting ve proje fırsatlarını keşfedin
            </p>
          </div>
          <JobsSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">İş İlanları</h1>
              <p className="text-lg text-gray-600">
                Size uygun casting ve proje fırsatlarını keşfedin
              </p>
            </div>
            {canPostJobs && (
              <Link href="/jobs/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  İlan Ver
                </Button>
              </Link>
            )}
          </div>
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
                {(Object.values(currentParams).some(Boolean) || searchTerm) && (
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
                    value={currentParams.jobType || ''}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
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
                    value={currentParams.jobType || ''}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
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
                    value={currentParams.city || ''}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durum
                  </label>
                  <select
                    value={currentParams.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Tümü</option>
                    <option value="OPEN">Açık</option>
                    <option value="CLOSED">Kapalı</option>
                  </select>
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
            <JobCard 
              key={job.id} 
              job={job} 
              userFlags={userFlags}
              isVisitor={isVisitor}
            />
          ))}
        </div>

        {/* Pagination */}
        <JobsPagination
          currentPage={currentParams.page || 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}
