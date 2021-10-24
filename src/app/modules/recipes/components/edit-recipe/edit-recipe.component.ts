import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { AppRoutingNames } from 'src/app/app-routing.module';
import { MessagesService } from 'src/app/modules/shared/services/messages/messages.service';
import { NgLog } from 'src/app/modules/shared/utils/decorators/log-decorator';
import { Recipe } from '../../models/recipes.model';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { RecipeService } from '../../services/recipe/recipe.service';

@NgLog()
@Component({
  selector: 'app-edit-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.scss'],
})
export class EditRecipeComponent implements OnInit, OnDestroy {
  recipeDetails!: Recipe;
  private destroy$: Subject<null> = new Subject();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private recipesService: RecipeService,
    private messagesService: MessagesService
  ) {}

  ngOnInit(): void {
    this.getRecipeDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  goToList(): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.myRecipes}`,
    ]);
  }

  goToReceipt(): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.details}`,
      this.recipeDetails.id,
    ]);
  }

  editRecipe(recipe: Recipe): void {
    this.recipesService
      .editRecipe(recipe)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          if (this.recipeDetails.imgSrc !== recipe.imgSrc) {
            return this.recipesService.deleteImage(this.recipeDetails.imgSrc);
          }
          return of({});
        })
      )
      .subscribe(() => {
        this.messagesService.showSnackBar('Receta actualizada');
        setTimeout(() => {
          // todo: try to avoid this!!
          window.location.reload();
        }, 700);
      });
  }

  private getRecipeDetails(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.recipeDetails = data.recipe));
  }
}
