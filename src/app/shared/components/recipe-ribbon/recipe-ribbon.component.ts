import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'app-recipe-ribbon',
  templateUrl: './recipe-ribbon.component.html',
  styleUrls: ['./recipe-ribbon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class RecipeRibbonComponent {
}
