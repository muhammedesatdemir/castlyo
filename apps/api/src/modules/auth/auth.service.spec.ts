import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { DATABASE_CONNECTION } from '../../config/database.module';
import { RegisterDto } from './dto/auth.dto';

// Mock database
const mockDb = {
  insert: jest.fn(),
  update: jest.fn(),
  select: jest.fn(),
};

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let db: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    db = module.get(DATABASE_CONNECTION);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterDto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
      role: 'TALENT',
      kvkkConsent: true,
      marketingConsent: false,
    };

    it('should successfully register a new user', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue(12);
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'user-123',
              email: 'test@example.com',
              role: 'TALENT',
              status: 'PENDING',
            },
          ]),
        }),
      });
      mockJwtService.sign.mockReturnValue('verification-token');

      // Act
      const result = await service.register(validRegisterDto);

      // Assert
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Registration successful. Please check your email for verification.',
        userId: 'user-123',
        verificationToken: 'verification-token',
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      // Act & Assert
      await expect(service.register(validRegisterDto)).rejects.toThrow(ConflictException);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      // Arrange
      const invalidDto = {
        ...validRegisterDto,
        passwordConfirm: 'DifferentPassword',
      };

      // Act & Assert
      await expect(service.register(invalidDto)).rejects.toThrow(BadRequestException);
      expect(mockUsersService.findByEmail).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if KVKK consent is missing', async () => {
      // Arrange
      const invalidDto = {
        ...validRegisterDto,
        kvkkConsent: false,
      };

      // Act & Assert
      await expect(service.register(invalidDto)).rejects.toThrow(BadRequestException);
      expect(mockUsersService.findByEmail).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should hash password before storing', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue(12);
      const insertMock = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'user-123' }]),
      });
      mockDb.insert.mockReturnValue({
        values: insertMock,
      });
      mockJwtService.sign.mockReturnValue('token');

      // Act
      await service.register(validRegisterDto);

      // Assert
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          role: 'TALENT',
          status: 'PENDING',
          passwordHash: expect.any(String),
        })
      );
      
      // Verify password is hashed (not plain text)
      const calledWith = insertMock.mock.calls[0][0];
      expect(calledWith.passwordHash).not.toBe('Password123!');
      expect(calledWith.passwordHash.length).toBeGreaterThan(20); // bcrypt hashes are long
    });
  });

  describe('Database Integration Evidence', () => {
    it('should log database operations for evidence', async () => {
      // This test demonstrates what gets logged for evidence
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue(12);
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'evidence-user-123',
              email: 'evidence@test.com',
              role: 'TALENT',
            },
          ]),
        }),
      });
      mockJwtService.sign.mockReturnValue('evidence-token');

      const registerDto = {
        ...validRegisterDto,
        email: 'evidence@test.com',
      };

      await service.register(registerDto);

      // Verify evidence is logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REGISTER] User created successfully: evidence-user-123')
      );
      
      consoleSpy.mockRestore();
    });
  });
});
