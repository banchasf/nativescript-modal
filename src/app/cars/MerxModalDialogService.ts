import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
  Injector,
  Type,
  ɵmarkDirty,
  NgModuleRef, NgZone,
  ViewContainerRef
} from "@angular/core";

import {
  AppHostAsyncView,
  AppHostView, ComponentPortal, DetachedLoader,
  ModalDialogOptions,
  ModalDialogParams, NativeScriptDomPortalOutlet, NgViewRef,
  NSLocationStrategy, once, ShowDialogOptions
} from "@nativescript/angular";
import {Subject} from "rxjs";
import {Application, ContentView, Frame} from "@nativescript/core";

@Injectable()
export class MerxModalDialogService {
  /**
   * Any opened ModalDialogParams in order of when they were opened (Most recent on top).
   * This can be used when you need access to ModalDialogParams outside of the component which had them injected.
   * Each is popped off as modals are closed.
   */
  openedModalParams: Array<ModalDialogParams>;
  _closed$: Subject<ModalDialogParams>;

  constructor(private location: NSLocationStrategy, private zone: NgZone, private appRef: ApplicationRef, private defaultInjector: Injector) {}

  /**
   * Emits anytime a modal is closed with the ModalDialogParams which were injected into the component which is now closing.
   * For example, can be used to wire up Rx flows outside the scope of just the component being handled.
   */
  get closed$() {
    if (!this._closed$) {
      this._closed$ = new Subject();
    }
    return this._closed$;
  }

  public showModal(type: Type<any>, options: ModalDialogOptions = {}): Promise<any> {
    // if (!options.viewContainerRef) {
    //   throw new Error('No viewContainerRef: ' + 'Make sure you pass viewContainerRef in ModalDialogOptions.');
    // }

    let parentView = options.viewContainerRef?.element.nativeElement || Application.getRootView();
    if (options.target) {
      parentView = options.target;
    }

    if ((parentView instanceof AppHostView || parentView instanceof AppHostAsyncView) && parentView.ngAppRoot) {
      parentView = parentView.ngAppRoot;
    }

    // _ngDialogRoot is the first child of the previously detached proxy.
    // It should have 'viewController' (iOS) or '_dialogFragment' (Android) available for
    // presenting future modal views.
    if (parentView._ngDialogRoot) {
      parentView = parentView._ngDialogRoot;
    }

    // resolve from particular module (moduleRef)
    // or from same module as parentView (viewContainerRef)
    const componentInjector = options.moduleRef?.injector || options.viewContainerRef?.injector || this.defaultInjector;
    const resolver = componentInjector.get(ComponentFactoryResolver);

    let frame = parentView;
    if (!(parentView instanceof Frame)) {
      frame = (parentView.page && parentView.page.frame) || Frame.topmost();
    }
    if(!options['disableNavigation']) {
      this.location?._beginModalNavigation(frame);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          this._showDialog({
            ...options,
            containerRef: options.viewContainerRef,
            injector: componentInjector,
            context: options.context,
            doneCallback: resolve,
            parentView,
            resolver,
            type,
          });
        } catch (err) {
          reject(err);
        }
      }, 10);
    });
  }

  private _showDialog(options: ShowDialogOptions): void {
    let componentViewRef: NgViewRef<unknown>;
    let detachedLoaderRef: ComponentRef<DetachedLoader>;
    let portalOutlet: NativeScriptDomPortalOutlet;

    const closeCallback = once((...args) => {
      options.doneCallback.apply(undefined, args);
      if (componentViewRef) {
        componentViewRef.firstNativeLikeView.closeModal();
        if(!options['disableNavigation']) {

          if (this._closed$) {
            const params = this.openedModalParams.pop();
            this._closed$.next(params);
          }
          this.location._closeModalNavigation();
        }
        if (detachedLoaderRef || portalOutlet) {
          this.zone.run(() => {
            portalOutlet?.dispose();
            detachedLoaderRef?.instance.detectChanges();
            detachedLoaderRef?.destroy();
          });
        }
      }
    });

    const modalParams = new ModalDialogParams(options.context, closeCallback);
    if (!this.openedModalParams) {
      this.openedModalParams = [];
    }
    this.openedModalParams.push(modalParams);

    const childInjector = Injector.create({
      providers: [{ provide: ModalDialogParams, useValue: modalParams }],
      parent: options.injector,
    });
    this.zone.run(() => {
      // if we ever support templates in the old API
      // if(options.templateRef) {
      //     const detachedFactory = options.resolver.resolveComponentFactory(DetachedLoader);
      //     if(options.attachToContainerRef) {
      //         detachedLoaderRef = options.attachToContainerRef.createComponent(detachedFactory, 0, childInjector, null);
      //     } else {
      //         detachedLoaderRef = detachedFactory.create(childInjector); // this DetachedLoader is **completely** detached
      //         this.appRef.attachView(detachedLoaderRef.hostView); // we attach it to the applicationRef, so it becomes a "root" view in angular's hierarchy
      //     }
      //     detachedLoaderRef.changeDetectorRef.detectChanges(); // force a change detection
      //     detachedLoaderRef.instance.createTemplatePortal(options.templateRef);
      // }
      const targetView = new ContentView();
      const portal = new ComponentPortal(options.type);
      portalOutlet = new NativeScriptDomPortalOutlet(targetView, options.resolver, this.appRef, childInjector);
      const componentRef = portalOutlet.attach(portal);
      ɵmarkDirty(componentRef.instance);
      componentViewRef = new NgViewRef(componentRef);
      if (options.useContextAsComponentProps && options.context) {
        for (const key in options.context) {
          (<ComponentRef<any>>componentViewRef.ref).instance[key] = options.context[key];
        }
      }
      if (componentViewRef !== componentRef.location.nativeElement) {
        componentRef.location.nativeElement._ngDialogRoot = componentViewRef.firstNativeLikeView;
      }
      // if we don't detach the view from its parent, ios gets mad
      componentViewRef.detachNativeLikeView();
      options.parentView.showModal(componentViewRef.firstNativeLikeView, { ...options, closeCallback });
    });
  }
}
