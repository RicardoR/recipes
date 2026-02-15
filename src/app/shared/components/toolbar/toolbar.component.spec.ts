import {ComponentFixture, TestBed} from '@angular/core/testing';
import {vi} from 'vitest';
import {ActivatedRoute, ActivatedRouteSnapshot, Router} from '@angular/router';
import {AuthService} from 'src/app/core/auth/services/auth.service';
import {userMock} from 'src/app/testing-resources/mocks/user-mock';
import {ToolbarComponent} from './toolbar.component';
import {of} from 'rxjs';
import {ToolbarService} from "../../services/toolbar/toolbar.service";

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;
  const routerSpy = {
    navigate: vi.fn().mockName("Router.navigate"),
    events: of()
  };
  const authServiceSpy = {
    currentUser: userMock,
    logout: vi.fn().mockName("AuthService.logout")
  };
  let activatedRouteSpy: Partial<ActivatedRoute>;
  let toolbarService: ToolbarService;

  beforeEach(() => {
    activatedRouteSpy = {
      snapshot: {
        firstChild: {
          data: {
            title: 'Title 1',
            displaySearchButton: true,
            displayListButton: false
          }
        } as unknown as ActivatedRouteSnapshot
      } as unknown as ActivatedRoute
    } as unknown as Partial<ActivatedRoute>;


    TestBed.configureTestingModule({
      imports: [ToolbarComponent],
      providers: [
        {provide: Router, useValue: routerSpy},
        {provide: AuthService, useValue: authServiceSpy},
        {provide: ActivatedRoute, useValue: activatedRouteSpy},
      ],
    }).overrideTemplate(ToolbarComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarComponent);
    toolbarService = TestBed.inject(ToolbarService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should get the userId from authService', () => {
    expect(component.userId).toEqual(userMock.uid);
  });

  it('goToCreate should navigate to recipes/new', () => {
    component.goToCreate();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/new']);
  });

  it('goToPrivateList should navigate to the private list', () => {
    component.goToPrivateList();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/my-recipes']);
  });

  it('goToPublicList should navigate to recipes', () => {
    component.goToPublicList();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes']);
  });

  it('goToLogin should navigate to login', () => {
    component.goToLogin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['login']);
  });

  it('logout should call to logout method from authService', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  it('should toggle displaySearchControl and focus input, and clear value when hiding', (() => {
    const focusSpy = vi.fn();
    component.searchElement = {nativeElement: {focus: focusSpy}} as {
      nativeElement: {
        focus: () => void;
      };
    };
    component.displaySearchControl = false;
    component.searchFormControl.setValue('algo');

    component.switchSearchControl();
    fixture.detectChanges()
    expect(component.displaySearchControl).toBe(true);
    fixture.detectChanges()
    expect(component.searchFormControl.value).toBe('algo');

    component.switchSearchControl();
    expect(component.displaySearchControl).toBe(false);
    expect(component.searchFormControl.value).toBe('');
  }));

  it('should get the title data from route', () => {
    fixture.detectChanges();
    component.ngOnInit();
    expect(component.title()).toBe('Title 1');
  });

  describe('displaySearchButton', () => {
    it('should display the displaySearchButton when the data route is true', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      activatedRouteSpy.snapshot.firstChild.data.displaySearchButton = true;
      fixture.detectChanges();
      component.ngOnInit();
      expect(component.displaySearchButton()).toBe(true);
    });

    it('should hide the displaySearchButton when the data route is false', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      activatedRouteSpy.snapshot.firstChild.data.displaySearchButton = false;
      fixture.detectChanges();
      component.ngOnInit();
      expect(component.displaySearchButton()).toBe(false);
    });

    it('should hide the displaySearchButton when the data route is null', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      activatedRouteSpy.snapshot.firstChild.data.displaySearchButton = null;
      fixture.detectChanges();
      component.ngOnInit();
      expect(component.displaySearchButton()).toBe(false);
    });
  });

  describe('displayListButton', () => {
    it('should display the public list link when the data route is true', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      activatedRouteSpy.snapshot.firstChild.data.displayListButton = true;
      fixture.detectChanges();
      component.ngOnInit();
      expect(component.displayListButton()).toBe(true);
    });

    it('should hide the public list link when the data route is false', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      activatedRouteSpy.snapshot.firstChild.data.displayListButton = false;
      fixture.detectChanges();
      component.ngOnInit();
      expect(component.displayListButton()).toBe(false);
    });

    it('should hide the public list link when the data route is null', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      activatedRouteSpy.snapshot.firstChild.data.displayListButton = null;
      fixture.detectChanges();
      component.ngOnInit();
      expect(component.displayListButton()).toBe(false);
    });
  });

  describe('searchControl', () => {
    it('should call to toolbar service when control is updated', () => {
      vi.spyOn(toolbarService, 'onSearch');
      component.searchFormControl.setValue('my recipe');
      expect(toolbarService.onSearch).toHaveBeenCalledWith('my recipe');
    });
  });
});
