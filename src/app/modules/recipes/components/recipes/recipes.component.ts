import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe/recipe.service';


@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss'],
})
export class RecipesComponent implements OnInit {
  constructor(
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private recipeService: RecipeService
  ) { }


  ngOnInit(): void {
     this.recipeService.getRecipes();
  }

  goToCreate(): void {
    this.route.navigate(['new'], { relativeTo: this.activatedRoute });
  }
}
