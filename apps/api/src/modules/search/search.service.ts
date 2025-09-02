import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';

export interface TalentSearchDocument {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  bio?: string;
  city: string;
  country: string;
  gender: string;
  age?: number;
  height?: number;
  weight?: number;
  eyeColor?: string;
  hairColor?: string;
  specialties: string[];
  skills: string[];
  languages: string[];
  experience: string;
  profileImage?: string;
  isPublic: boolean;
  profileViews: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobSearchDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  talentType: string;
  location: string;
  requirements?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  ageMin?: number;
  ageMax?: number;
  genderRequirement?: string;
  heightMin?: number;
  heightMax?: number;
  skills: string[];
  languages: string[];
  tags: string[];
  isUrgent: boolean;
  isFeatured: boolean;
  views: number;
  applicationCount: number;
  applicationDeadline: string;
  publishedAt: string;
  agency: {
    companyName: string;
    isVerified: boolean;
    city: string;
  };
}

export interface SearchFilters {
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  heightMax?: number;
  city?: string;
  languages?: string[];
  skills?: string[];
  specialties?: string[];
  experience?: string;
  category?: string;
  talentType?: string;
  budgetMin?: number;
  budgetMax?: number;
  isUrgent?: boolean;
  isFeatured?: boolean;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private client: MeiliSearch;
  private talentsIndex: Index;
  private jobsIndex: Index;

  constructor(private configService: ConfigService) {
    const host = this.configService.get('MEILISEARCH_HOST', 'http://localhost:7700');
    const apiKey = this.configService.get('MEILISEARCH_API_KEY');
    
    this.client = new MeiliSearch({
      host,
      apiKey,
    });
  }

  async onModuleInit() {
    try {
      // Initialize indexes
      this.talentsIndex = this.client.index('talents');
      this.jobsIndex = this.client.index('jobs');

      // Configure talents index
      await this.configureTalentsIndex();
      
      // Configure jobs index
      await this.configureJobsIndex();
      
      console.log('Meilisearch indexes configured successfully');
    } catch (error) {
      console.error('Error configuring Meilisearch:', error);
      // In development, continue without search if Meilisearch is not available
      if (this.configService.get('NODE_ENV') === 'development') {
        console.warn('Meilisearch not available in development mode');
      }
    }
  }

  private async configureTalentsIndex() {
    try {
      // Set filterable attributes
      await this.talentsIndex.updateFilterableAttributes([
        'gender',
        'city',
        'country',
        'specialties',
        'skills',
        'languages',
        'experience',
        'isPublic',
        'age',
        'height',
        'weight'
      ]);

      // Set sortable attributes
      await this.talentsIndex.updateSortableAttributes([
        'profileViews',
        'createdAt',
        'updatedAt'
      ]);

      // Set searchable attributes with ranking
      await this.talentsIndex.updateSearchableAttributes([
        'firstName',
        'lastName',
        'displayName',
        'bio',
        'specialties',
        'skills',
        'city'
      ]);

      // Set ranking rules
      await this.talentsIndex.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'profileViews:desc'
      ]);
    } catch (error) {
      console.error('Error configuring talents index:', error);
    }
  }

  private async configureJobsIndex() {
    try {
      // Set filterable attributes
      await this.jobsIndex.updateFilterableAttributes([
        'category',
        'talentType',
        'location',
        'budgetMin',
        'budgetMax',
        'ageMin',
        'ageMax',
        'genderRequirement',
        'heightMin',
        'heightMax',
        'skills',
        'languages',
        'tags',
        'isUrgent',
        'isFeatured',
        'agency.isVerified',
        'agency.city'
      ]);

      // Set sortable attributes
      await this.jobsIndex.updateSortableAttributes([
        'publishedAt',
        'applicationDeadline',
        'views',
        'applicationCount',
        'budgetMin',
        'budgetMax'
      ]);

      // Set searchable attributes with ranking
      await this.jobsIndex.updateSearchableAttributes([
        'title',
        'description',
        'requirements',
        'location',
        'agency.companyName',
        'skills',
        'tags'
      ]);

      // Set ranking rules
      await this.jobsIndex.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'isFeatured:desc',
        'isUrgent:desc',
        'publishedAt:desc'
      ]);
    } catch (error) {
      console.error('Error configuring jobs index:', error);
    }
  }

  // Talent indexing methods
  async indexTalent(talent: TalentSearchDocument): Promise<void> {
    try {
      await this.talentsIndex.addDocuments([talent]);
    } catch (error) {
      console.error('Error indexing talent:', error);
    }
  }

  async updateTalent(talent: TalentSearchDocument): Promise<void> {
    try {
      await this.talentsIndex.addDocuments([talent]);
    } catch (error) {
      console.error('Error updating talent in index:', error);
    }
  }

  async deleteTalent(talentId: string): Promise<void> {
    try {
      await this.talentsIndex.deleteDocument(talentId);
    } catch (error) {
      console.error('Error deleting talent from index:', error);
    }
  }

  // Job indexing methods
  async indexJob(job: JobSearchDocument): Promise<void> {
    try {
      await this.jobsIndex.addDocuments([job]);
    } catch (error) {
      console.error('Error indexing job:', error);
    }
  }

  async updateJob(job: JobSearchDocument): Promise<void> {
    try {
      await this.jobsIndex.addDocuments([job]);
    } catch (error) {
      console.error('Error updating job in index:', error);
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      await this.jobsIndex.deleteDocument(jobId);
    } catch (error) {
      console.error('Error deleting job from index:', error);
    }
  }

  // Search methods
  async searchTalents(
    query: string = '',
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const filterStrings = this.buildTalentFilters(filters);
      const sort = this.buildTalentSort();

      const searchResults = await this.talentsIndex.search(query, {
        filter: filterStrings,
        sort,
        limit,
        offset: (page - 1) * limit,
        attributesToHighlight: ['firstName', 'lastName', 'bio', 'specialties'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      });

      return {
        hits: searchResults.hits,
        totalHits: searchResults.estimatedTotalHits,
        page,
        limit,
        totalPages: Math.ceil((searchResults.estimatedTotalHits || 0) / limit),
        processingTimeMs: searchResults.processingTimeMs,
        facetDistribution: searchResults.facetDistribution,
      };
    } catch (error) {
      console.error('Error searching talents:', error);
      throw error;
    }
  }

  async searchJobs(
    query: string = '',
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const filterStrings = this.buildJobFilters(filters);
      const sort = this.buildJobSort();

      const searchResults = await this.jobsIndex.search(query, {
        filter: filterStrings,
        sort,
        limit,
        offset: (page - 1) * limit,
        attributesToHighlight: ['title', 'description', 'requirements'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      });

      return {
        hits: searchResults.hits,
        totalHits: searchResults.estimatedTotalHits,
        page,
        limit,
        totalPages: Math.ceil((searchResults.estimatedTotalHits || 0) / limit),
        processingTimeMs: searchResults.processingTimeMs,
        facetDistribution: searchResults.facetDistribution,
      };
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  }

  private buildTalentFilters(filters: SearchFilters): string[] {
    const filterStrings: string[] = ['isPublic = true'];

    if (filters.gender) {
      filterStrings.push(`gender = "${filters.gender}"`);
    }

    if (filters.ageMin) {
      filterStrings.push(`age >= ${filters.ageMin}`);
    }

    if (filters.ageMax) {
      filterStrings.push(`age <= ${filters.ageMax}`);
    }

    if (filters.heightMin) {
      filterStrings.push(`height >= ${filters.heightMin}`);
    }

    if (filters.heightMax) {
      filterStrings.push(`height <= ${filters.heightMax}`);
    }

    if (filters.city) {
      filterStrings.push(`city = "${filters.city}"`);
    }

    if (filters.experience) {
      filterStrings.push(`experience = "${filters.experience}"`);
    }

    if (filters.languages?.length) {
      const languageFilter = filters.languages.map(lang => `"${lang}"`).join(' OR ');
      filterStrings.push(`languages IN [${languageFilter}]`);
    }

    if (filters.skills?.length) {
      const skillFilter = filters.skills.map(skill => `"${skill}"`).join(' OR ');
      filterStrings.push(`skills IN [${skillFilter}]`);
    }

    if (filters.specialties?.length) {
      const specialtyFilter = filters.specialties.map(spec => `"${spec}"`).join(' OR ');
      filterStrings.push(`specialties IN [${specialtyFilter}]`);
    }

    return filterStrings;
  }

  private buildJobFilters(filters: SearchFilters): string[] {
    const filterStrings: string[] = [];

    if (filters.category) {
      filterStrings.push(`category = "${filters.category}"`);
    }

    if (filters.talentType) {
      filterStrings.push(`talentType = "${filters.talentType}"`);
    }

    if (filters.city) {
      filterStrings.push(`location = "${filters.city}"`);
    }

    if (filters.budgetMin) {
      filterStrings.push(`budgetMin >= ${filters.budgetMin}`);
    }

    if (filters.budgetMax) {
      filterStrings.push(`budgetMax <= ${filters.budgetMax}`);
    }

    if (filters.isUrgent) {
      filterStrings.push('isUrgent = true');
    }

    if (filters.isFeatured) {
      filterStrings.push('isFeatured = true');
    }

    if (filters.languages?.length) {
      const languageFilter = filters.languages.map(lang => `"${lang}"`).join(' OR ');
      filterStrings.push(`languages IN [${languageFilter}]`);
    }

    if (filters.skills?.length) {
      const skillFilter = filters.skills.map(skill => `"${skill}"`).join(' OR ');
      filterStrings.push(`skills IN [${skillFilter}]`);
    }

    return filterStrings;
  }

  private buildTalentSort(): string[] {
    return ['profileViews:desc', 'updatedAt:desc'];
  }

  private buildJobSort(): string[] {
    return ['isFeatured:desc', 'isUrgent:desc', 'publishedAt:desc'];
  }

  // Get search suggestions
  async getTalentSuggestions(query: string, limit: number = 5) {
    try {
      const results = await this.talentsIndex.search(query, {
        limit,
        attributesToSearchOn: ['firstName', 'lastName', 'displayName', 'specialties'],
        attributesToRetrieve: ['id', 'firstName', 'lastName', 'displayName', 'specialties'],
      });

      return results.hits;
    } catch (error) {
      console.error('Error getting talent suggestions:', error);
      return [];
    }
  }

  async getJobSuggestions(query: string, limit: number = 5) {
    try {
      const results = await this.jobsIndex.search(query, {
        limit,
        attributesToSearchOn: ['title', 'description'],
        attributesToRetrieve: ['id', 'title', 'category', 'location'],
      });

      return results.hits;
    } catch (error) {
      console.error('Error getting job suggestions:', error);
      return [];
    }
  }

  // Get facets for filters
  async getTalentFacets() {
    try {
      const results = await this.talentsIndex.search('', {
        limit: 0,
        facets: ['city', 'specialties', 'skills', 'languages', 'experience', 'gender'],
      });

      return results.facetDistribution;
    } catch (error) {
      console.error('Error getting talent facets:', error);
      return {};
    }
  }

  async getJobFacets() {
    try {
      const results = await this.jobsIndex.search('', {
        limit: 0,
        facets: ['category', 'talentType', 'location', 'skills', 'languages', 'agency.city'],
      });

      return results.facetDistribution;
    } catch (error) {
      console.error('Error getting job facets:', error);
      return {};
    }
  }
}
