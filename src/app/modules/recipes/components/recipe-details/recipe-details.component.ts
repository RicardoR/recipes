import {Component, DestroyRef, inject, input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatCardModule} from '@angular/material/card';
import {AsyncPipe, DatePipe} from '@angular/common';
import {EMPTY, Observable} from 'rxjs';
import {concatMap, map, tap} from 'rxjs/operators';

import {AppRoutingNames} from 'src/app/app.routes';
import {NgLog} from 'src/app/modules/shared/utils/decorators/log-decorator';
import {RecipesRoutingNames} from '../../recipes.routes';
import {DeleteRecipeDialogComponent} from '../delete-recipe-dialog/delete-recipe-dialog.component';
import {AuthService} from '../../../auth/services/auth.service';
import {Recipe} from '../../models/recipes.model';
import {RecipeService} from '../../services/recipe/recipe.service';
import {ToolbarComponent} from '../../../shared/components/toolbar/toolbar.component';
import {AnalyticsService} from "../../../shared/services/Analytics/analytics.service";

@NgLog()
@Component({
  selector: 'app-recipe-details',
  standalone: true,
  templateUrl: './recipe-details.component.html',
  styleUrls: ['./recipe-details.component.scss'],
  imports: [
    ToolbarComponent,
    MatCardModule,
    MatExpansionModule,
    MatListModule,
    MatButtonModule,
    AsyncPipe,
    DatePipe
  ]
})
export class RecipeDetailsComponent implements OnInit {
  id = input.required<string>()
  recipeDetails$!: Observable<Recipe>;
  isOwnRecipe = false;
  currentUserId?: string;

  private recipeDetails!: Recipe;

  private destroyRef = inject(DestroyRef);
  private recipesService = inject(RecipeService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private analytics = inject(AnalyticsService);

  ngOnInit(): void {
    this.analytics.sendToAnalytics('recipe_detail_component_opened');
    this.currentUserId = this.authService.currentUser?.uid;
    this.getRecipeDetails();
  }

  deleteRecipe(): void {
    this.analytics.sendToAnalytics('delete_recipe_button_clicked');

    const dialogRef = this.dialog.open(DeleteRecipeDialogComponent);

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        concatMap((data) =>
          data === true
            ? this.recipesService.deleteRecipe(this.recipeDetails.id)
            : EMPTY
        ),
        concatMap(() =>
          this.recipesService.deleteImage(this.recipeDetails.imgSrc)
        )
      )
      .subscribe(() => this.router.navigate([AppRoutingNames.recipes]));
  }

  editRecipe(): void {
    this.analytics.sendToAnalytics('edit_recipe_button_clicked');
    if (this.recipeDetails.id) {
      this.goToEditRecipe(this.recipeDetails.id);
    }
  }

  cloneRecipe(recipe: Recipe): void {
    this.analytics.sendToAnalytics('clone_recipe_button_clicked');

    this.recipesService
      .cloneRecipe(recipe)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((recipeId) => this.goToEditRecipe(recipeId));
  }

  private getRecipeDetails(): void {
    this.recipeDetails$ = this.recipesService.getRecipeDetail(this.id()).pipe(
      tap((data) => {
        this.isOwnRecipe = data.ownerId === this.currentUserId;
        this.recipeDetails = data;
      }),
      map((data) => data)
    );
  }

  private goToEditRecipe(recipeId: string): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.edit}`,
      recipeId,
    ]);
  }
}
