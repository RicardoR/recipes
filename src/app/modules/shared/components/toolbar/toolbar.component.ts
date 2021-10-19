import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutingNames } from 'src/app/app-routing.module';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { RecipesRoutingNames } from 'src/app/modules/recipes/recipes-routing.module';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  @Input() displayListButton = false;

  userId?: string;
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.userId = this.authService.currentUser?.uid;
  }

  goToCreate(): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.new}`,
    ]);
  }

  goToPrivateList(): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.myRecipes}`,
    ]);
  }

  goToPublicList(): void {
    this.router.navigate([`${AppRoutingNames.recipes}`]);
  }

  logout(): void {
    this.authService.logout();
  }
}
