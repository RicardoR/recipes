import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {Component, DestroyRef, effect, inject, input, OnInit, output, signal} from '@angular/core';
import {filter, tap} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {DatePipe} from '@angular/common';

import {ElementModel} from 'src/app/features/recipes/models/element.model';
import {RecipeService} from 'src/app/features/recipes/services/recipe/recipe.service';
import {NgLog} from '../../utils/decorators/log-decorator';

import {Recipe} from '../../../features/recipes/models/recipes.model';
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
    MatProgressSpinnerModule,
    RecipeRibbonComponent,
    MatButtonModule,
    DatePipe
  ]
})
export class RecipeListComponent implements OnInit {
  readonly recipes = input.required<Recipe[]>();
  readonly userId = input<string>();
  readonly ribbonTitle = input('Privada');
  readonly publicList = input(true);
  readonly goToRecipe$ = output<Recipe>();
  readonly deleteRecipe$ = output<Recipe>();
  readonly cloneRecipe$ = output<Recipe>();

  private destroyRef = inject(DestroyRef);
  private recipeService = inject(RecipeService);

  categories: ElementModel[] = [];
  categoryFilter = new FormControl<ElementModel[] | null>(null);
  recipesFiltered = signal<Recipe[]>([]);

  constructor() {
    effect(() => this.recipesFiltered.set(this.recipes()));
  }

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
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(value => value !== null && value !== undefined)
      )
      .subscribe((value) => this.filterRecipes(value));
  }

  private filterRecipes(categoriesSelected: ElementModel[]): void {
    if (!categoriesSelected || categoriesSelected?.length === 0) {
      this.recipesFiltered.set(this.recipes());
      return;
    }

    this.recipesFiltered.set(this.findRecipesByCategory(categoriesSelected));
  }

  private findRecipesByCategory(categoriesSelected: ElementModel[]): Recipe[] {
    return this.recipes().filter(recipe => this.filterRecipesByCategories(recipe, categoriesSelected));
  }

  private filterRecipesByCategories(recipe: Recipe, categoriesSelected: ElementModel[]) {
    if (!recipe.categories) {
      return false;
    }
    return recipe.categories?.some(category => this.filterCategories(categoriesSelected, category));
  }

  private filterCategories(categoriesSelected: ElementModel[], category: ElementModel): boolean {
    return categoriesSelected?.some(categorySelected => categorySelected.id === category.id);
  }
}
