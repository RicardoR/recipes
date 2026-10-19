import {Directive} from '@angular/core';

/**
 * Marca el icono que se proyecta dentro del botón de selección de fichero.
 *
 * Sustituye al icono por defecto (`attach_file`) del componente `app-file-input`.
 * No aporta comportamiento: sólo sirve como marca para el `ng-content select`.
 */
@Directive({
  selector: '[appFileInputIcon]',
})
export class FileInputIconDirective {}
