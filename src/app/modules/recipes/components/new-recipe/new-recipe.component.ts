import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppRoutingNames } from 'src/app/app-routing.module';
import { RecipeService } from '../../services/recipe/recipe.service';
import { Recipe } from './../../models/recipes.model';

@Component({
  selector: 'app-new-recipe',
  templateUrl: './new-recipe.component.html',
  styleUrls: ['./new-recipe.component.scss'],
})
export class NewRecipeComponent implements OnDestroy {
  private destroy$: Subject<null> = new Subject();

  constructor(
    private recipeService: RecipeService,
    private router: Router
  ) { }

  ngOnDestroy(): void {
    this.destroy$.next(null);
  }

  goToList(): void {
    this.router.navigate([AppRoutingNames.recipes]);
  }

  createRecipe(recipe: Recipe): void {
    this.recipeService
      .createRecipe(recipe)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.goToList());
  }
}
