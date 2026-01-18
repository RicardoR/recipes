import { TestBed } from '@angular/core/testing';
import { UtilService } from '../utils.service';

describe('UtilService', () => {
  let service: UtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UtilService],
    });

    service = TestBed.inject(UtilService);
  });

  it('validateFile should determine if a file name is valid', () => {
    const textFile = new File(['content'], 'filename.txt', {
      type: 'text/plain',
    });
    const imageFile = new File(['content'], 'filename.png', {
      type: 'image/png',
    });

    expect(service.validateFile(textFile)).toBeFalsy();
    expect(service.validateFile(imageFile)).toBeTruthy();
  });
});
