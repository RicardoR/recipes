import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
  input,
  output
} from '@angular/core';
import {ReactiveFormsModule, UntypedFormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {AppRoutingNames} from 'src/app/app.routes';
import {AuthService} from 'src/app/modules/auth/services/auth.service';
import {RecipesRoutingNames} from 'src/app/modules/recipes/recipes.routes';


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatMenuModule
  ]
})
export class ToolbarComponent implements OnInit {
  readonly displayListButton = input(false);
  readonly displaySearchButton = input(true);
  readonly searchText$ = output<string>();

  @ViewChild('search') searchElement: ElementRef | undefined;

  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private authService = inject(AuthService);

  userId?: string;
  displaySearchControl = false;
  searchFormControl = new UntypedFormControl('', []);

  ngOnInit(): void {
    this.userId = this.authService.currentUser?.uid;
    this.listenSearchText();
  }

  goToCreate(): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.new}`,
    ]);
  }

  goToPrivateList(): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.myRecipes}`,
    ]);
  }

  goToPublicList(): void {
    this.router.navigate([`${AppRoutingNames.recipes}`]);
  }

  logout(): void {
    this.authService.logout();
    this.userId = undefined;
  }

  switchSearchControl(): void {
    this.displaySearchControl = !this.displaySearchControl;
    setTimeout(() => {
      this.searchElement?.nativeElement.focus();
    }, 0);

    if (!this.displaySearchControl) {
      this.searchFormControl.setValue('');
    }
  }

  private listenSearchText(): void {
    this.searchFormControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.searchText$.emit(value));
  }
}
