import {ReactiveFormsModule, UntypedFormControl} from '@angular/forms';
import {Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output, input} from '@angular/core';
import {tap} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatCardModule} from '@angular/material/card';
import {DatePipe} from '@angular/common';

import {ElementModel} from 'src/app/modules/recipes/models/element.model';
import {RecipeService} from 'src/app/modules/recipes/services/recipe/recipe.service';
import {NgLog} from '../../utils/decorators/log-decorator';

import {Recipe} from '../../../recipes/models/recipes.model';
import {MatButtonModule} from '@angular/material/button';
import {RecipeRibbonComponent} from '../recipe-ribbon/recipe-ribbon.component';
import {RecipesMultipleSelectComponent} from '../recipes-multiple-select/recipes-multiple-select.component';

@NgLog()
@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss'],
  imports: [
    RecipesMultipleSelectComponent,
    ReactiveFormsModule,
    MatCardModule,
    RecipeRibbonComponent,
    MatButtonModule,
    DatePipe
  ]
})
export class RecipeListComponent implements OnInit {
  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input() set recipes(recipeList: Recipe[]) {
    this._recipes = recipeList;
    this.filterRecipes(this.categoryFilter.value);
  }

  readonly userId = input<string>();
  readonly ribbonTitle = input('Privada');
  readonly publicList = input(true);
  @Output() goToRecipe$: EventEmitter<Recipe> = new EventEmitter();
  @Output() deleteRecipe$: EventEmitter<Recipe> = new EventEmitter();
  @Output() cloneRecipe$: EventEmitter<Recipe> = new EventEmitter();

  private destroyRef = inject(DestroyRef);
  private recipeService = inject(RecipeService);
  private _recipes: Recipe[] = [];

  categories?: ElementModel[] = undefined;
  categoryFilter = new UntypedFormControl();
  recipesFiltered: Recipe[] = [];

  ngOnInit(): void {
    this.getCategories();
    this.listenCategoryFilter();
  }

  goToRecipe(recipe: Recipe): void {
    this.goToRecipe$.emit(recipe);
  }

  deleteRecipe(recipe: Recipe): void {
    this.deleteRecipe$.emit(recipe);
  }

  cloneRecipe(recipe: Recipe): void {
    this.cloneRecipe$.emit(recipe);
  }

  private getCategories(): void {
    this.recipeService
      .getCategories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((categories) => (this.categories = categories))
      )
      .subscribe();
  }

  private listenCategoryFilter(): void {
    this.categoryFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.filterRecipes(value));
  }

  private filterRecipes(categoriesSelected: ElementModel[]): void {
    if (!categoriesSelected || categoriesSelected?.length === 0) {
      this.recipesFiltered = [...this._recipes];
      return;
    }

    this.recipesFiltered = this._recipes.filter((recipe) => {
      return recipe.categories?.some((category) =>
        this.filterCategories(categoriesSelected, category)
      );
    });
  }

  private filterCategories(
    categoriesSelected: ElementModel[],
    category: ElementModel
  ): boolean {
    return categoriesSelected?.some(
      (categorySelected) => categorySelected.id === category.id
    );
  }
}
