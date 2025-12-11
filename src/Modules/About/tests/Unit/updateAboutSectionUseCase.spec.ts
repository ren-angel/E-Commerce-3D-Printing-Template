import { validate } from 'class-validator';
import { UpdateAboutSectionUseCase } from '../../Application/Use-cases/updateAboutSection.use-case';
import { UpdateAboutSectionDto } from '../../Interfaces/DTOs/update-about-section.dto';
import { DomainError } from "src/Modules/Shared/custom-errors.exception";

// Unit tests for the UpdateAboutSectionUseCase>
describe('UpdateAboutSectionUseCase (unit)', () => {

  // Variables to hold the use-case instance and mocks. Use mocks for unit testing because we want to isolate the use-case logic from external dependencies
  let usecase: UpdateAboutSectionUseCase;
  let mockRepo: any;
  let mockCache: any;
  let mockLogger: any;

  // Runs before each test to reset mocks and create fresh instances
  beforeEach(() => {

    // Mock implementation of each dependency using Jest
    mockRepo = {
      create: jest.fn(),
    };

    mockCache = {
      set: jest.fn(),
      del: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    // Create a new instance of the use-case with mocked dependencies
    usecase = new UpdateAboutSectionUseCase(
      mockRepo,
      mockCache,
      mockLogger,
    );
  });

  // Test case: successful update of an about section
  it('updates a section, deletes old cache, and caches the updated section', async () => {

    // Input DTO for creating an about section
    const dto = new UpdateAboutSectionDto();
    dto.section = 'Y';
    dto.sectionPosition = 2;
    dto.contentText = 'Updated Content';

    // Mocked updated object returned by the repository
    const updated = {
      aboutId: 1,
      section: 'Y',
      sectionPosition: 2,
      contentText: 'Updated Content',
    };

    // Mock the validate function to return no errors
    jest.spyOn(require('class-validator'), 'validate').mockResolvedValue([]);

    // Makes repository return the created object when called. mockResolvedValue simulates an async function returning a resolved promise
    mockRepo.update.mockResolvedValue(updated);

    // Executes the use-case with the DTO
    const result = await usecase.execute(1, dto);

    // Asserts that the logger logged the update message. toHaveBeenCalledWith checks if the mock function was called with specific arguments
    expect(mockLogger.log).toHaveBeenCalledWith('Updating about section...');

    // Checks if repository.update was called with the correct ID and input DTO
    expect(mockRepo.update).toHaveBeenCalledWith(1, dto);

    // Checks if cache delete method was called with correct parameters
    expect(mockCache.del).toHaveBeenCalledWith('about-section:1');

    // Checks if the updated section was cached correctly
    expect(mockCache.set).toHaveBeenCalledWith(
      'about-section:1',
      updated,
      (60000 * 60) * 24,
    );

    // Asserts that the result from the use-case matches the updated object
    expect(result).toEqual(updated);
  });

  // Test case: no DTO provided
  it('throws error when no DTO is provided', async () => {

    // Expects the use-case execution to throw an error when no DTO is provided
    await expect(usecase.execute(1, null)).rejects.toThrow(
      'Dados da seção são obrigatórios para atualização.'
    );

    // Asserts that the logger logged the error
    expect(mockLogger.error).toHaveBeenCalled();
  });

  // Test case: repository returns null (no section updated)
  it('returns error if repository returns null', async () => {

    // Input DTO for updating an about section
    const dto = new UpdateAboutSectionDto();
    dto.section = 'A';
    dto.sectionPosition = 1;
    dto.contentText = 'Content';

    // Mock the repository to return null, simulating no section updated
    mockRepo.update.mockResolvedValue(null);

    // Expects the use-case execution to throw a specific error message
    await expect(usecase.execute(1, dto)).rejects.toThrow(
      'Nenhuma seção foi atualizada.'
    );

    // Asserts that the logger logged the error
    expect(mockLogger.error).toHaveBeenCalled();
  });

  // Test case: validation error before executing the use-case (DTO fails validation)
  it('throws validation error before finishing update', async () => {

    // Create a DTO with invalid data to trigger validation errors
    const dto = new UpdateAboutSectionDto();
    dto.section = '';
    dto.sectionPosition = 0;
    dto.contentText = '';

    // Validate the DTO using class-validator
    const errors = await validate(dto);

    // Assert that there are validation errors
    expect(errors.length).toBeGreaterThan(0);

    // Mock the validate function to return errors
    jest.spyOn(require('class-validator'), 'validate').mockResolvedValue(errors);

    // Expects the use-case execution to throw a DomainError due to validation failure
    await expect(usecase.execute(1, dto)).rejects.toThrow(DomainError);

    // Asserts that the logger logged the error
    expect(mockLogger.error).toHaveBeenCalled();
  });

  // Test case: rethrows DomainError from repository
  it('rethrows DomainError from repository', async () => {

    // Input DTO for updating an about section
    const dto = new UpdateAboutSectionDto();
    dto.section = 'X';
    dto.sectionPosition = 1;
    dto.contentText = 'Content';

    // Mock the validate function to return no errors
    jest.spyOn(require('class-validator'), 'validate').mockResolvedValue([]);

    // Makes repository.update throw a DomainError when called
    mockRepo.update.mockRejectedValue(new DomainError('Invalid'));

    // Expects the use-case execution to rethrow the DomainError
    await expect(usecase.execute(1, dto)).rejects.toBeInstanceOf(DomainError);

    // Asserts that the logger logged the error
    expect(mockLogger.error).toHaveBeenCalled();
  });

  // Test case: repository throws an exception
  it('wraps unknown errors in general update error', async () => {

    // Input DTO for updating an about section
    const dto = new UpdateAboutSectionDto();
    dto.section = 'X';
    dto.sectionPosition = 1;
    dto.contentText = 'Content';

    // Mock the validate function to return no errors
    jest.spyOn(require('class-validator'), 'validate').mockResolvedValue([]);

    // Makes repository.update throw an error when called
    mockRepo.update.mockRejectedValue(new Error('DB ERR'));

    // Expects the use-case execution to throw a generic error message
    await expect(usecase.execute(1, dto)).rejects.toThrow(
      'Erro ao atualizar a seção.'
    );

    // Asserts that the logger logged the error
    expect(mockLogger.error).toHaveBeenCalled();
  });
});