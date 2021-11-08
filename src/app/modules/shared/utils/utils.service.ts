import { Injectable } from '@angular/core';

@Injectable()
export class UtilService {
  private imageFileTypes = [
    'image/apng',
    'image/bmp',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
  ];

  validateFile(file: File): boolean {
    return this.imageFileTypes.includes(file.type);
  }
}
