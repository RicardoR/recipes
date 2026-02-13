import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { RecipeService } from '../../services/recipe/recipe.service';
import { RecipeDetailsComponent } from './recipe-details.component';
import { AuthService } from 'src/app/core/auth/services/auth.service';
import { recipeMock } from 'src/app/testing-resources/mocks/recipe-mock';
import { userMock } from 'src/app/testing-resources/mocks/user-mock';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';

describe('RecipeDetailsComponent', () => {
    let component: RecipeDetailsComponent;
    let fixture: ComponentFixture<RecipeDetailsComponent>;

    const recipeServiceSpy = {
        deleteRecipe: vi.fn().mockName("RecipeService.deleteRecipe"),
        deleteImage: vi.fn().mockName("RecipeService.deleteImage"),
        getRecipeDetail: vi.fn().mockName("RecipeService.getRecipeDetail")
    };

    const routerSpy = {
        navigate: vi.fn().mockName("Router.navigate")
    };
    const authServiceSpy = {
        currentUser: {} as never
    };
    const matDialogSpy = {
        open: vi.fn().mockName("MatDialog.open")
    };
    const analyticsSpy = {
        sendToAnalytics: vi.fn().mockName("AnalyticsService.sendToAnalytics")
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RecipeDetailsComponent],
            providers: [
                { provide: RecipeService, useValue: recipeServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: AnalyticsService, useValue: analyticsSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RecipeDetailsComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('id', recipeMock.id);
        recipeServiceSpy.getRecipeDetail.mockReturnValue(of(recipeMock));
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        authServiceSpy.currentUser = userMock;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('getRecipeDetails should get the recipe details and determine if is the owner', () => {
        component.recipeDetails$.subscribe((recipe) => expect(recipe).toEqual(recipeMock));
        expect(component.isOwnRecipe).toBeFalsy();
    });

    describe('deleteRecipe', () => {
        beforeEach(() => {
            recipeServiceSpy.deleteRecipe.mockClear();
            recipeServiceSpy.deleteImage.mockClear();
            matDialogSpy.open.mockClear();
            routerSpy.navigate.mockClear();
        });

        it('should delete the recipe when user confirm the dialog', () => {
            matDialogSpy.open.mockReturnValue({ afterClosed: () => of(true) });
            recipeServiceSpy.deleteRecipe.mockReturnValue(of(true));
            recipeServiceSpy.deleteImage.mockReturnValue(of(true));

            component.deleteRecipe();
            expect(matDialogSpy.open).toHaveBeenCalled();
            expect(recipeServiceSpy.deleteRecipe).toHaveBeenCalledWith(recipeMock.id);
            expect(recipeServiceSpy.deleteImage).toHaveBeenCalledWith(recipeMock.imgSrc);
            expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes']);
            expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('delete_recipe_button_clicked');
        });

        it('should not delete the recipe when user cancel the dialog', () => {
            matDialogSpy.open.mockReturnValue({ afterClosed: () => of(false) });

            component.deleteRecipe();
            expect(matDialogSpy.open).toHaveBeenCalled();

            expect(recipeServiceSpy.deleteRecipe).not.toHaveBeenCalled();
            expect(recipeServiceSpy.deleteImage).not.toHaveBeenCalled();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
            expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('delete_recipe_button_clicked');
        });
    });

    describe('editRecipe', () => {
        it('should navigate to edit recipe page when recipe has an id', () => {
            component.editRecipe();

            expect(routerSpy.navigate).toHaveBeenCalledWith([
                'recipes/edit',
                recipeMock.id,
            ]);
            expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('edit_recipe_button_clicked');
        });
    });

    it('should log recipe_detail_component_opened event at start', () => {
        expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('recipe_detail_component_opened');
    });
});
