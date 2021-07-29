import { switchMap, take } from 'rxjs/operators';
import { RecipeService } from './../../services/recipe/recipe.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-recipe-details',
  templateUrl: './recipe-details.component.html',
  styleUrls: ['./recipe-details.component.scss'],
})
export class RecipeDetailsComponent implements OnInit {
  constructor(
    private recipesService: RecipeService,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.getRecipeDetails();
  }

  private getRecipeDetails() {
    this.route.params
      .pipe(
        take(1),
        switchMap(param => this.recipesService.getPrivateRecipeDetail(param.id))
      ).subscribe(
        (data) => {
          console.log('data', data);
        }
      );
  }
}
