import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../modules/users/users.service';
import { DRIZZLE } from '../config/database.module';

// Mock the database module to avoid real database connection
jest.mock('@castlyo/database', () => ({
  users: {
    id: 'users.id',
    email: 'users.email',
    phone: 'users.phone',
    role: 'users.role',
    status: 'users.status',
    emailVerified: 'users.emailVerified',
    createdAt: 'users.createdAt',
    updatedAt: 'users.updatedAt',
  },
  talentProfiles: {
    userId: 'talentProfiles.userId',
    firstName: 'talentProfiles.firstName',
    lastName: 'talentProfiles.lastName',
    city: 'talentProfiles.city',
    gender: 'talentProfiles.gender',
    birthDate: 'talentProfiles.birthDate',
  },
}));

describe('UsersService - Profile Completeness', () => {
  let service: UsersService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]), // Default to empty array
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('isTalentProfileComplete', () => {
    it('should return true when all required fields are present', async () => {
      const mockProfile = {
        firstName: 'John',
        lastName: 'Doe',
        city: 'Istanbul',
        gender: 'male',
        birthDate: '1990-01-01',
      };

      // Reset the mock to return the profile data
      mockDb.limit.mockResolvedValueOnce([mockProfile]);

      const result = await service.isTalentProfileComplete('user-id');

      expect(result).toBe(true);
      expect(mockDb.select).toHaveBeenCalledWith({
        firstName: 'talentProfiles.firstName',
        lastName: 'talentProfiles.lastName',
        city: 'talentProfiles.city',
        gender: 'talentProfiles.gender',
        birthDate: 'talentProfiles.birthDate',
      });
    });

    it('should return false when profile is missing', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await service.isTalentProfileComplete('user-id');

      expect(result).toBe(false);
    });

    it('should return false when required fields are empty', async () => {
      const mockProfile = {
        firstName: 'John',
        lastName: '', // Empty field
        city: 'Istanbul',
        gender: 'male',
        birthDate: '1990-01-01',
      };

      mockDb.limit.mockResolvedValue([mockProfile]);

      const result = await service.isTalentProfileComplete('user-id');

      expect(result).toBe(false);
    });

    it('should return false when required fields are null', async () => {
      const mockProfile = {
        firstName: 'John',
        lastName: 'Doe',
        city: null, // Null field
        gender: 'male',
        birthDate: '1990-01-01',
      };

      mockDb.limit.mockResolvedValue([mockProfile]);

      const result = await service.isTalentProfileComplete('user-id');

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      mockDb.limit.mockRejectedValue(new Error('Database error'));

      const result = await service.isTalentProfileComplete('user-id');

      expect(result).toBe(false);
    });
  });

  describe('isAgencyProfileComplete', () => {
    it('should return true when all required fields are present', async () => {
      const mockUser = {
        email: 'agency@example.com',
        phone: '+905551234567',
      };

      mockDb.limit.mockResolvedValue([mockUser]);

      const result = await service.isAgencyProfileComplete('user-id');

      expect(result).toBe(true);
      expect(mockDb.select).toHaveBeenCalledWith({
        email: 'users.email',
        phone: 'users.phone',
      });
    });

    it('should return false when profile is missing', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await service.isAgencyProfileComplete('user-id');

      expect(result).toBe(false);
    });

    it('should return false when required fields are empty', async () => {
      const mockProfile = {
        agencyName: '', // Empty field
        city: 'Istanbul',
      };

      mockDb.limit.mockResolvedValue([mockProfile]);

      const result = await service.isAgencyProfileComplete('user-id');

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      mockDb.limit.mockRejectedValue(new Error('Database error'));

      const result = await service.isAgencyProfileComplete('user-id');

      expect(result).toBe(false);
    });
  });

  describe('getMe with profile completeness', () => {
    it('should return correct flags for TALENT with complete profile', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        phone: '+905551234567',
        role: 'TALENT',
        status: 'ACTIVE',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTalentProfile = {
        firstName: 'John',
        lastName: 'Doe',
        city: 'Istanbul',
        gender: 'male',
        birthDate: '1990-01-01',
      };

      // Reset mocks for this test
      mockDb.limit.mockReset();
      mockDb.limit
        .mockResolvedValueOnce([mockUser]) // First call for user data
        .mockResolvedValueOnce([mockTalentProfile]) // Second call for talent profile
        .mockResolvedValueOnce([]); // Third call for agency profile

      const result = await service.getMe('user-id');

      expect(result).toEqual({
        ...mockUser,
        isAgencyProfileComplete: false,
        isTalentProfileComplete: true,
        canPostJobs: false,
        canApplyJobs: true,
      });
    });

    it('should return correct flags for AGENCY with complete profile', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        phone: '+905551234567',
        role: 'AGENCY',
        status: 'ACTIVE',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAgencyUser = {
        email: 'agency@example.com',
        phone: '+905551234567',
      };

      // Reset mocks for this test
      mockDb.limit.mockReset();
      mockDb.limit
        .mockResolvedValueOnce([mockUser]) // First call for user data
        .mockResolvedValueOnce([]) // Second call for talent profile
        .mockResolvedValueOnce([mockAgencyUser]); // Third call for agency user

      const result = await service.getMe('user-id');

      expect(result).toEqual({
        ...mockUser,
        isAgencyProfileComplete: true,
        isTalentProfileComplete: false,
        canPostJobs: true,
        canApplyJobs: false,
      });
    });

    it('should return correct flags for USER role', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        phone: '+905551234567',
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Reset mocks for this test
      mockDb.limit.mockReset();
      mockDb.limit
        .mockResolvedValueOnce([mockUser]) // First call for user data
        .mockResolvedValueOnce([]) // Second call for talent profile
        .mockResolvedValueOnce([]); // Third call for agency profile

      const result = await service.getMe('user-id');

      expect(result).toEqual({
        ...mockUser,
        isAgencyProfileComplete: false,
        isTalentProfileComplete: false,
        canPostJobs: false,
        canApplyJobs: false,
      });
    });
  });
});
