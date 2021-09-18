import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { AppRoutingNames } from 'src/app/app-routing.module';
import { MessagesService } from 'src/app/modules/shared/services/messages/messages.service';
import { Recipe } from '../../models/recipes.model';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { RecipeService } from '../../services/recipe/recipe.service';

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
  }

  goToList(): void {
    this.router.navigate([AppRoutingNames.recipes]);
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
    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((param) =>
          this.recipesService.getPrivateRecipeDetail(param.id)
        )
      )
      .subscribe((data: Recipe) => {
        this.recipeDetails = data;
      });
  }
}
