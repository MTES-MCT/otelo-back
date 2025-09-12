import { Test, TestingModule } from '@nestjs/testing';
import { ExportPowerpointController } from './export-powerpoint.controller';

describe('ExportPowerpointController', () => {
  let controller: ExportPowerpointController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportPowerpointController],
    }).compile();

    controller = module.get<ExportPowerpointController>(ExportPowerpointController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
