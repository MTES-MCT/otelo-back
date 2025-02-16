import { Test, TestingModule } from '@nestjs/testing';
import { NewConstructionsService } from './new-constructions.service';

describe('NewConstructionsService', () => {
  let service: NewConstructionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewConstructionsService],
    }).compile();

    service = module.get<NewConstructionsService>(NewConstructionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
