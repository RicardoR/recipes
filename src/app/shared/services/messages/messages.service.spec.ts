import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';

import { MessagesService } from './messages.service';

describe('MessagesService', () => {
    let service: MessagesService;
    const matBnackBarSpy = {
        open: vi.fn().mockName("MatSnackBar.open")
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                MessagesService,
                { provide: MatSnackBar, useValue: matBnackBarSpy },
            ],
        });

        service = TestBed.inject(MessagesService);
    });

    it('showSnackBar should open then snackBar', () => {
        service.showSnackBar('test');
        expect(matBnackBarSpy.open).toHaveBeenCalledWith('test', undefined, {
            duration: 3000,
        });
    });
});
