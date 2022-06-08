import { UntypedFormControl } from '@angular/forms';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, tap, filter, takeWhile } from 'rxjs/operators';
import { ElementModel } from 'src/app/modules/recipes/models/element.model';
import { RecipeService } from 'src/app/modules/recipes/services/recipe/recipe.service';
import { NgLog } from '../../utils/decorators/log-decorator';

import { Recipe } from './../../../recipes/models/recipes.model';
@NgLog()
@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss']
})
export class RecipeListComponent implements OnInit, OnDestroy {
  @Input() set recipes(recipeList: Recipe[]) {
    this._recipes = recipeList;
    this.filterRecipes(this.categoryFilter.value);
  }
  @Input() userId?: string;
  @Input() ribbonTitle = 'Privada';
  @Input() publicList = true;
  @Output() goToRecipe$: EventEmitter<Recipe> = new EventEmitter();
  @Output() deleteRecipe$: EventEmitter<Recipe> = new EventEmitter();
  @Output() cloneRecipe$: EventEmitter<Recipe> = new EventEmitter();

  private destroy$ = new Subject<void>();
  private _recipes: Recipe[] = [];

  categories?: ElementModel[] = undefined;
  categoryFilter = new UntypedFormControl();
  recipesFiltered: Recipe[] = [];

  constructor(private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.getCategories();
    this.listenCategoryFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        takeUntil(this.destroy$),
        tap(categories => (this.categories = categories))
      )
      .subscribe();
  }

  private listenCategoryFilter(): void {
    this.categoryFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.filterRecipes(value));
  }

  private filterRecipes(categoriesSelected: ElementModel[]): void {
    if (!categoriesSelected || categoriesSelected?.length === 0) {
      this.recipesFiltered = [...this._recipes];
      return;
    }

    this.recipesFiltered = this._recipes.filter(recipe => {
      return recipe.categories?.some(category =>
        this.filterCategories(categoriesSelected, category)
      );
    });
  }

  private filterCategories(
    categoriesSelected: ElementModel[],
    category: ElementModel
  ): boolean {
    return categoriesSelected?.some(
      categorySelected => categorySelected.id === category.id
    );
  }
}
