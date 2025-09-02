import { 
  Controller, 
  Get, 
  Query,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('talents')
  async searchTalents(
    @Query('q') query: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('gender') gender?: string,
    @Query('ageMin') ageMin?: string,
    @Query('ageMax') ageMax?: string,
    @Query('heightMin') heightMin?: string,
    @Query('heightMax') heightMax?: string,
    @Query('city') city?: string,
    @Query('experience') experience?: string,
    @Query('languages') languages?: string,
    @Query('skills') skills?: string,
    @Query('specialties') specialties?: string,
  ) {
    const filters = {
      gender,
      ageMin: ageMin ? parseInt(ageMin) : undefined,
      ageMax: ageMax ? parseInt(ageMax) : undefined,
      heightMin: heightMin ? parseInt(heightMin) : undefined,
      heightMax: heightMax ? parseInt(heightMax) : undefined,
      city,
      experience,
      languages: languages ? languages.split(',') : undefined,
      skills: skills ? skills.split(',') : undefined,
      specialties: specialties ? specialties.split(',') : undefined,
    };

    return this.searchService.searchTalents(
      query,
      filters,
      parseInt(page),
      parseInt(limit)
    );
  }

  @Public()
  @Get('jobs')
  async searchJobs(
    @Query('q') query: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('category') category?: string,
    @Query('talentType') talentType?: string,
    @Query('city') city?: string,
    @Query('budgetMin') budgetMin?: string,
    @Query('budgetMax') budgetMax?: string,
    @Query('isUrgent') isUrgent?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('languages') languages?: string,
    @Query('skills') skills?: string,
  ) {
    const filters = {
      category,
      talentType,
      city,
      budgetMin: budgetMin ? parseInt(budgetMin) : undefined,
      budgetMax: budgetMax ? parseInt(budgetMax) : undefined,
      isUrgent: isUrgent === 'true',
      isFeatured: isFeatured === 'true',
      languages: languages ? languages.split(',') : undefined,
      skills: skills ? skills.split(',') : undefined,
    };

    return this.searchService.searchJobs(
      query,
      filters,
      parseInt(page),
      parseInt(limit)
    );
  }

  @Public()
  @Get('suggestions/talents')
  async getTalentSuggestions(
    @Query('q') query: string,
    @Query('limit') limit: string = '5'
  ) {
    return this.searchService.getTalentSuggestions(query, parseInt(limit));
  }

  @Public()
  @Get('suggestions/jobs')
  async getJobSuggestions(
    @Query('q') query: string,
    @Query('limit') limit: string = '5'
  ) {
    return this.searchService.getJobSuggestions(query, parseInt(limit));
  }

  @Public()
  @Get('facets/talents')
  async getTalentFacets() {
    return this.searchService.getTalentFacets();
  }

  @Public()
  @Get('facets/jobs')
  async getJobFacets() {
    return this.searchService.getJobFacets();
  }
}
