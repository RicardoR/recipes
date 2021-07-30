import { AuthService } from './../../../auth/services/auth.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutingNames } from 'src/app/app-routing.module';
import { switchMap, take } from 'rxjs/operators';

import { Recipe } from './../../models/recipes.model';
import { RecipeService } from './../../services/recipe/recipe.service';

@Component({
  selector: 'app-recipe-details',
  templateUrl: './recipe-details.component.html',
  styleUrls: ['./recipe-details.component.scss'],
})
export class RecipeDetailsComponent implements OnInit {
  recipeDetails: Recipe | undefined;
  isOwnReceip = false;

  constructor(
    private recipesService: RecipeService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.getRecipeDetails();
  }

  goToList(): void {
    this.router.navigate([AppRoutingNames.recipes]);
  }

  private getRecipeDetails() {
    this.route.params
      .pipe(
        take(1),
        switchMap((param) =>
          this.recipesService.getPrivateRecipeDetail(param.id)
        )
      )
      .subscribe(
        (data: Recipe) => {
          this.recipeDetails = data.id ? data : undefined;
          this.isOwnReceip = data.ownerId === this.authService.currentUser?.uid;
        });
  }
}
