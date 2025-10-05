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
import { useCurrentUserStatus } from '@/hooks/useCurrentUserStatus'
import { JobCard } from '@/components/jobs/JobCard'
import { JobsPagination } from '@/components/jobs/JobsPagination'
import { JobsSkeleton } from '@/components/jobs/JobsSkeleton'
import { JobCreateSheet } from '@/components/jobs/JobCreateSheet'
import { toast } from '@/components/ui/toast'
import Link from 'next/link'

export default function JobsPage() {
  const { jobs, meta, loading, error, currentParams, updateParams, clearFilters } = useJobs()
  const { userFlags, isVisitor, canPostJobs } = useUserFlags()
  const user = useCurrentUserStatus()
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState(currentParams.q || '')

  // DEBUG: ekranda rolü göster, sonra kaldırırız
  console.log("JobsPage user:", user);

  const handleSearch = () => {
    updateParams({ q: searchTerm })
  }

  const handleFilterChange = (key: string, value: any) => {
    updateParams({ [key]: value })
  }

  const handlePageChange = (page: number) => {
    updateParams({ page })
  }

  const requireAgencyOnboarding = () => {
    toast.info("Ajans bilgilerinizi tamamlamadan ilan veremezsiniz.");
    window.location.assign("/onboarding/agency");
  };

  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-[#F6E6C3] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#F6E6C3] mb-2">İş İlanları</h1>
            <p className="text-lg text-[#F6E6C3]/80">
              Size uygun casting ve proje fırsatlarını keşfedin
            </p>
          </div>
          <JobsSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="jobs-page min-h-screen bg-[#0B0F1A] text-[#F6E6C3] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#F6E6C3] mb-2">İş İlanları</h1>
              <p className="text-lg text-[#F6E6C3]/80">
                Size uygun casting ve proje fırsatlarını keşfedin
              </p>
            </div>
            {/* Girişli herkese göster → tıklamada kontrol */}
            {user.isAuthenticated && (
              <JobCreateSheet
                canPostJobs={user.canPostJobs}
                isAgency={user.role === "AGENCY"}
                onRequireAgencyOnboarding={requireAgencyOnboarding}
              />
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6 bg-[#0B0F1A] border-[#F6E6C3]/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#F6E6C3]/60" />
                  <Input
                    placeholder="İlan başlığı, açıklama ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="jobs-search-input pl-10 bg-transparent text-[#F6E6C3] placeholder:text-[#F6E6C3]/60 caret-[#F6E6C3] border-[#F6E6C3]/30 focus:outline-none focus:ring-2 focus:ring-[#F6E6C3]/40"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  className="px-8 bg-[#962901] text-[#F6E6C3] hover:opacity-90"
                >
                  Ara
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 border-[#F6E6C3]/40 text-[#F6E6C3] hover:bg-[#F6E6C3]/10"
                >
                  <Filter className="h-4 w-4" />
                  Filtrele
                </Button>
                {(Object.values(currentParams).some(Boolean) || searchTerm) && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="border-[#F6E6C3]/40 text-[#F6E6C3] hover:bg-[#F6E6C3]/10"
                  >
                    Temizle
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-[#F6E6C3]/20 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#F6E6C3] mb-1">
                    Kategori
                  </label>
                  <select
                    value={currentParams.jobType || ''}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
                    className="cream-select-trigger w-full px-3 py-2 border border-[#F6E6C3]/30 rounded-md bg-[#0B0F1A] text-[#F6E6C3]"
                  >
                    <option value="">Tümü</option>
                    {JOB_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Yetenek Türü filtresi kaldırıldı */}

                <div>
                  <label className="block text-sm font-medium text-[#F6E6C3] mb-1">
                    Şehir
                  </label>
                  <select
                    value={currentParams.city || ''}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="cream-select-trigger w-full px-3 py-2 border border-[#F6E6C3]/30 rounded-md bg-[#0B0F1A] text-[#F6E6C3]"
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
                  <label className="block text-sm font-medium text-[#F6E6C3] mb-1">
                    Durum
                  </label>
                  <select
                    value={currentParams.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="cream-select-trigger w-full px-3 py-2 border border-[#F6E6C3]/30 rounded-md bg-[#0B0F1A] text-[#F6E6C3]"
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

        {/* User Status Warnings */}
        {user.role === "TALENT" && !user.canApplyJobs && (
          <div className="mb-4 p-4 bg-[#F6E6C3]/10 border border-[#F6E6C3]/30 rounded-lg">
            <p className="text-sm text-[#F6E6C3]">
              Başvuru yapabilmek için{" "}
              <Link className="underline font-medium text-[#F6E6C3]" href="/onboarding/talent">
                profilinizi tamamlayın
              </Link>.
            </p>
          </div>
        )}
        {!user.isAuthenticated && (
          <div className="mb-4 p-4 bg-[#F6E6C3]/10 border border-[#F6E6C3]/30 rounded-lg">
            <p className="text-sm text-[#F6E6C3]">
              Başvuru için{" "}
              <Link className="underline font-medium text-[#F6E6C3]" href="/auth">
                giriş yapın
              </Link>.
            </p>
          </div>
        )}

        {/* Results */}
        {error && (
          <Card className="mb-6 bg-[#0B0F1A] border-[#F6E6C3]/20">
            <CardContent className="p-6 text-center text-red-400">
              {error}
            </CardContent>
          </Card>
        )}

        {jobs.length === 0 && !loading && !error && (
          <Card className="bg-[#0B0F1A] border-[#F6E6C3]/20">
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-[#F6E6C3]/60 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#F6E6C3] mb-2">
                İlan bulunamadı
              </h3>
              <p className="text-[#F6E6C3]/80">
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
              currentUser={userFlags ? { 
                id: userFlags.id, 
                role: userFlags.role as 'AGENCY' | 'TALENT' | 'ADMIN',
                agencyProfileId: userFlags.agencyProfileId 
              } : undefined}
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
