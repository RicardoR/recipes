import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { MessagesService } from 'src/app/shared/services/messages/messages.service';
import { RecipeService } from '../../services/recipe/recipe.service';
import { EditRecipeComponent } from './edit-recipe.component';
import { recipeMock } from '../../../../testing-resources/mocks/recipe-mock';
import { AnalyticsService } from "../../../../shared/services/analytics/analytics.service";

describe('EditRecipeComponent', () => {
    let component: EditRecipeComponent;
    let fixture: ComponentFixture<EditRecipeComponent>;

    const routeSpy = {
        navigate: vi.fn().mockName("Router.navigate")
    };
    const recipeServiceSpy = {
        updateRecipe: vi.fn().mockName("RecipeService.updateRecipe"),
        deleteImage: vi.fn().mockName("RecipeService.deleteImage"),
        getRecipeDetail: vi.fn().mockName("RecipeService.getRecipeDetail")
    };
    const messagesServiceSpy = {
        showSnackBar: vi.fn().mockName("MessagesService.showSnackBar")
    };
    const analyticsSpy = {
        sendToAnalytics: vi.fn().mockName("AnalyticsService.sendToAnalytics")
    };


    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [EditRecipeComponent],
            providers: [
                { provide: Router, useValue: routeSpy },
                { provide: RecipeService, useValue: recipeServiceSpy },
                { provide: MessagesService, useValue: messagesServiceSpy },
                { provide: AnalyticsService, useValue: analyticsSpy },
            ],
        }).overrideTemplate(EditRecipeComponent, '');
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditRecipeComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('id', recipeMock.id);
        recipeServiceSpy.updateRecipe.mockReturnValue(of({}));
        recipeServiceSpy.getRecipeDetail.mockReturnValue(of(recipeMock));
        recipeServiceSpy.deleteImage.mockReturnValue(of({}));
        fixture.detectChanges();
    });

    it('should get the recipe details when loading', () => {
        expect(component.recipeDetails).toEqual(recipeMock);
    });

    it('goToList should allow to navigate to private list', () => {
        component.goToList();
        expect(routeSpy.navigate).toHaveBeenCalledWith(['recipes/my-recipes']);
    });

    it('goToReceipt should allow to navigate to the receipt', () => {
        component.goToRecipe();
        expect(routeSpy.navigate).toHaveBeenCalledWith([
            'recipes/details',
            component.recipeDetails.id,
        ]);
    });

    it('updateRecipe should allow to update the recipe', () => {
        recipeServiceSpy.updateRecipe.mockReturnValue(of({}));
        component.updateRecipe(component.recipeDetails);
        expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('update_recipe_button_clicked');
        expect(recipeServiceSpy.updateRecipe).toHaveBeenCalledWith(component.recipeDetails);
        expect(messagesServiceSpy.showSnackBar).toHaveBeenCalledWith('Receta actualizada');
    });

    it('should delete the old image when is changed', () => {
        const newRecipe = { ...recipeMock };
        newRecipe.imgSrc = 'new-image';
        component.updateRecipe(newRecipe);
        expect(recipeServiceSpy.deleteImage).toHaveBeenCalledWith(component.recipeDetails.imgSrc);
    });

    it('should log edit_recipe_component_opened event', () => {
        expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('edit_recipe_component_opened');
    });
});
