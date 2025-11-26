import { validate } from "class-validator";
import { UpdateAboutSectionDto } from "../../Interfaces/DTOs/update-about-section.dto";
UpdateAboutSectionDto
import { UpdateAboutSectionUseCase } from "../../Application/Use-cases/updateAboutSection.use-case";

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
  it('updates a section and caches the section', async () => {

//     // Input DTO for creating an about section
//     const dto = new UpdateAboutSectionDto();
//     dto.section = 'X';
//     dto.sectionPosition = 1;
//     dto.contentText = 'Content';

//     const created = {
//       aboutId: 1,
//       section: 'X',
//       sectionPosition: 1,
//       contentText: 'Content',
//     };

//     // Makes repository return the created object when called. mockResolvedValue simulates an async function returning a resolved promise
//     mockRepo.create.mockResolvedValue(created);

//     // Executes the use-case with the DTO
//     const result = await usecase.execute(dto);

//     // Asserts that the logger logged the creation message. toHaveBeenCalledWith checks if the mock function was called with specific arguments
//     expect(mockLogger.log).toHaveBeenCalledWith('Creating about section...');

//     // Checks if repository.create was called with the same input DTO
//     expect(mockRepo.create).toHaveBeenCalledWith(dto);

//     // Checks if cache methods were called with correct parameters
//     expect(mockCache.rpush).toHaveBeenCalledWith(
//       'about-sections:list',
//       created.aboutId,
//       (60000 * 60) * 24,
//     );

//     // Checks if the new section was cached correctly
//     expect(mockCache.set).toHaveBeenCalledWith(
//       `about-section:${created.aboutId}`,
//       created,
//       (60000 * 60) * 24,
//     );

//     // Asserts that the result from the use-case matches the created object
//     expect(result).toEqual(created);
//   });

//   // Test case: repository returns null (no section created)
//   it('returns null if repository returns null', async () => {

//     // Makes repository return null to simulate no section being created
//     mockRepo.create.mockResolvedValue(null);

//     // Expects the use-case execution to throw a specific error message
//     await expect(usecase.execute({
//       section: 'X',
//       sectionPosition: 1,
//       contentText: 'Content',
//     })).rejects.toThrow('Nenhuma seção foi criada.');

//     // Asserts that the logger logged the error
//     expect(mockLogger.error).toHaveBeenCalled();
//   });

//   // Test case: validation error before executing the use-case (DTO fails validation)
//   it('throws validation error before executing the use-case', async () => {

//     // Create a DTO with invalid data to trigger validation errors
//     const dto = new CreateAboutSectionDto();
//     dto.section = '';
//     dto.sectionPosition = 0;
//     dto.contentText = '';

//     // Validate the DTO using class-validator
//     const errors = await validate(dto);

//     // Assert that there are validation errors
//     expect(errors.length).toBeGreaterThan(0);

//     // Attempt to execute the use-case and expect it to throw an error
//     await expect(usecase.execute(dto)).rejects.toThrow();

//     // Asserts that the logger logged the error
//     expect(mockLogger.error).toHaveBeenCalled();
//   });

//   // Test case: no DTO provided
//   it('throws error when no DTO is provided', async () => {
    
//     // Expects the use-case execution to throw an error when no DTO is provided
//     await expect(usecase.execute(null)).rejects.toThrow('Dados da seção são obrigatórios para criação.');

//     // Asserts that the logger logged the error
//     expect(mockLogger.error).toHaveBeenCalled();
//   });

//   // Test case: repository throws an exception
//   it('throws exception when repository throws', async () => {

//     // Makes repository.create throw an error when called
//     mockRepo.create.mockRejectedValue(new Error('DB error'));

//     // Expects the use-case execution to throw a generic error message
//     await expect(
//       usecase.execute({
//         section: 'X',
//         sectionPosition: 1,
//         contentText: 'Content',
//       })
//     ).rejects.toThrow('Erro ao criar a seção.');

//     // Asserts that the logger logged the error
//     expect(mockLogger.error).toHaveBeenCalled();
  });
});