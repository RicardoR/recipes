import { Component } from '@angular/core';
import {ToolbarComponent} from "../../../../shared/components/toolbar/toolbar.component";
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-recipe-layout',
  imports: [
    ToolbarComponent,
    RouterOutlet
  ],
  templateUrl: './recipe-layout.component.html',
  styleUrl: './recipe-layout.component.scss'
})
export class RecipeLayoutComponent {

}
