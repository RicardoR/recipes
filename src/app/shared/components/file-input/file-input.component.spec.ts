import {Component, signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {ErrorStateMatcher} from '@angular/material/core';
import {MatIconModule} from '@angular/material/icon';
import {By} from '@angular/platform-browser';

import {FileInputComponent} from './file-input.component';
import {FileInputIconDirective} from './file-input-icon.directive';

@Component({
  template: `
    <mat-form-field>
      <app-file-input
        [formControl]="control"
        [accept]="accept()"
        [required]="required()"
        [errorStateMatcher]="errorStateMatcher()">
        <mat-icon appFileInputIcon>folder</mat-icon>
      </app-file-input>
    </mat-form-field>
  `,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    FileInputComponent,
    FileInputIconDirective,
  ],
})
class FileInputHostComponent {
  control = new FormControl<File | File[] | null>(null);
  readonly accept = signal('image/*');
  readonly required = signal(false);
  readonly errorStateMatcher = signal<ErrorStateMatcher | undefined>(undefined);
}

@Component({
  template: `
    <mat-form-field>
      <app-file-input
        [formControl]="control"
        [multiple]="true"
        [separator]="separator">
        <mat-icon appFileInputIcon>folder</mat-icon>
      </app-file-input>
    </mat-form-field>
  `,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    FileInputComponent,
    FileInputIconDirective,
  ],
})
class FileInputMultipleHostComponent {
  control = new FormControl<File | File[] | null>(null);
  separator = ',';
}

@Component({
  template: `
    <mat-form-field>
      <app-file-input [formControl]="control"></app-file-input>
    </mat-form-field>
  `,
  imports: [MatFormFieldModule, ReactiveFormsModule, FileInputComponent],
})
class FileInputHostWithoutIconComponent {
  control = new FormControl<File | File[] | null>(null);
}

function createFile(name: string, type = 'image/png'): File {
  return new File(['contenido'], name, {type});
}

function createFileList(...files: File[]): FileList {
  return {
    length: files.length,
    item: (index: number) => files[index],
    [Symbol.iterator]: function* () {
      yield* files;
    },
  } as unknown as FileList;
}

function displayInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
  return fixture.nativeElement.querySelector(
    'input.mat-mdc-form-field-input-control'
  ) as HTMLInputElement;
}

function fileInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
  return fixture.nativeElement.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
}

function componentOf(fixture: ComponentFixture<unknown>): FileInputComponent {
  return fixture.debugElement.query(
    By.directive(FileInputComponent)
  ).componentInstance as FileInputComponent;
}

describe('FileInputComponent', () => {
  describe('con icono proyectado', () => {
    let fixture: ComponentFixture<FileInputHostComponent>;
    let host: FileInputHostComponent;
    let component: FileInputComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({imports: [FileInputHostComponent]});

      fixture = TestBed.createComponent(FileInputHostComponent);
      host = fixture.componentInstance;
      component = componentOf(fixture);
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show the file name when a value is written', () => {
      const file = createFile('receta.png');

      host.control.setValue(file);
      fixture.detectChanges();

      expect(displayInput(fixture).value).toBe('receta.png');
    });

    it('should propagate the selected file to the form control', () => {
      const file = createFile('receta.png');

      component.handleFiles(createFileList(file));

      expect(host.control.value).toBe(file);
    });

    it('should apply the accept attribute to the native file input', () => {
      expect(fileInput(fixture).accept).toBe('image/*');
    });

    it('should be disabled when the form control is disabled', () => {
      host.control.disable();
      fixture.detectChanges();

      expect(component.disabled).toBe(true);
      expect(
        (
          fixture.nativeElement.querySelector(
            'button.button-browse'
          ) as HTMLButtonElement
        ).disabled
      ).toBe(true);
    });

    it('should mark the control as touched when the file picker is opened', () => {
      const clickSpy = vi
        .spyOn(fileInput(fixture), 'click')
        .mockImplementation(() => {
          // el selector de ficheros real no existe en el entorno de test
        });

      component.openFilePicker();

      expect(clickSpy).toHaveBeenCalled();
      expect(host.control.touched).toBe(true);
    });

    it('should reflect the error state of the form control', () => {
      host.control.setErrors({image: true});
      host.control.markAsTouched();
      fixture.detectChanges();

      expect(component.errorState).toBe(true);
    });

    it('should not have an error state while the control is valid', () => {
      fixture.detectChanges();

      expect(component.errorState).toBe(false);
    });

    it('should use a custom error state matcher', () => {
      host.errorStateMatcher.set({isErrorState: () => true} as ErrorStateMatcher);
      fixture.detectChanges();

      expect(component.errorState).toBe(true);
    });

    it('should be required when the required input is set', () => {
      expect(component.required).toBe(false);

      host.required.set(true);
      fixture.detectChanges();

      expect(component.required).toBe(true);
    });

    it('should notify the form field when an input changes', () => {
      const stateChanges = vi.fn();
      component.stateChanges.subscribe(stateChanges);

      host.accept.set('image/png');
      fixture.detectChanges();

      expect(stateChanges).toHaveBeenCalled();
    });

    it('should replace the default icon with the projected one', () => {
      const defaultIcon = fixture.nativeElement.querySelector(
        'mat-icon.ngx-mat-file-input--default-icon'
      );
      const projectedIcon = fixture.nativeElement.querySelector(
        'button.button-browse mat-icon'
      ) as HTMLElement;

      expect(defaultIcon).toBeNull();
      expect(projectedIcon).toBeTruthy();
      expect(projectedIcon.textContent?.trim()).toBe('folder');
    });
  });

  describe('con multiple', () => {
    let fixture: ComponentFixture<FileInputMultipleHostComponent>;
    let host: FileInputMultipleHostComponent;
    let component: FileInputComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [FileInputMultipleHostComponent],
      });

      fixture = TestBed.createComponent(FileInputMultipleHostComponent);
      host = fixture.componentInstance;
      host.separator = ' | ';
      component = componentOf(fixture);
      fixture.detectChanges();
    });

    it('should propagate an array of files', () => {
      const first = createFile('uno.png');
      const second = createFile('dos.png');

      component.handleFiles(createFileList(first, second));

      expect(host.control.value).toEqual([first, second]);
    });

    it('should join the file names with the separator', () => {
      component.handleFiles(
        createFileList(createFile('uno.png'), createFile('dos.png'))
      );

      expect(displayInput(fixture).value).toBe('uno.png | dos.png');
    });
  });

  describe('sin icono proyectado', () => {
    let fixture: ComponentFixture<FileInputHostWithoutIconComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [FileInputHostWithoutIconComponent],
      });

      fixture = TestBed.createComponent(FileInputHostWithoutIconComponent);
      fixture.detectChanges();
    });

    it('should render the default icon', () => {
      const defaultIcon = fixture.nativeElement.querySelector(
        'mat-icon.ngx-mat-file-input--default-icon'
      ) as HTMLElement;

      expect(defaultIcon).toBeTruthy();
      expect(defaultIcon.textContent?.trim()).toBe('attach_file');
    });
  });
});
