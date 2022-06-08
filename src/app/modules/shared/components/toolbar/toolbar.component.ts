import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppRoutingNames } from 'src/app/app-routing.module';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { RecipesRoutingNames } from 'src/app/modules/recipes/recipes-routing.module';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent implements OnInit, OnDestroy {
  @Input() displayListButton = false;
  @Input() displaySearchButton = true;
  @Output() searchText$: EventEmitter<string> = new EventEmitter();

  @ViewChild('search') searchElement: ElementRef | undefined;

  private destroy$: Subject<null> = new Subject();

  userId?: string;
  displaySearchControl = false;
  searchFormControl = new UntypedFormControl('', []);

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.userId = this.authService.currentUser?.uid;
    this.listenSearchText();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
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
    this.userId = undefined;
  }

  switchSearchControl(): void {
    this.displaySearchControl = !this.displaySearchControl;
    setTimeout(() => {
      this.searchElement?.nativeElement.focus();
    }, 0);

    if (!this.displaySearchControl) {
      this.searchFormControl.setValue('');
    }
  }

  private listenSearchText(): void {
    this.searchFormControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.searchText$.emit(value));
  }
}
