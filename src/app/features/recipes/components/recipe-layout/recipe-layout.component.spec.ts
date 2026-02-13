import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RecipeLayoutComponent } from './recipe-layout.component';
import { AuthService } from "../../../../core/auth/services/auth.service";
import { ActivatedRoute } from "@angular/router";

describe('RecipeLayoutComponent', () => {
    let component: RecipeLayoutComponent;
    let fixture: ComponentFixture<RecipeLayoutComponent>;
    const authServiceSpy = {
        currentUser: vi.fn().mockName("AuthService.currentUser"),
        logout: vi.fn().mockName("AuthService.logout")
    };
    const activatedRouteSpy = {
        snapshot: vi.fn().mockName("ActivatedRoute.snapshot")
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RecipeLayoutComponent],
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy }
            ],
        })
            .compileComponents();

        fixture = TestBed.createComponent(RecipeLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the toolbar', () => {
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('[data-test="toolbar"]')).toBeTruthy();
    });
});
