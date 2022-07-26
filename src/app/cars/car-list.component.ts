import {Component, OnDestroy, OnInit, ViewContainerRef} from '@angular/core'
import { ModalDialogService, RouterExtensions } from '@nativescript/angular'
import { ListViewEventData } from 'nativescript-ui-listview'
import { Subscription } from 'rxjs'
import { finalize } from 'rxjs/operators'
import { ObservableArray } from '@nativescript/core'

import { Car } from './shared/car.model'
import { CarService } from './shared/car.service'
import {SimpleModal} from "./modal/SimpleModal";

@Component({
  selector: 'CarsList',
  templateUrl: './car-list.component.html',
  styleUrls: ['./car-list.component.scss'],
})
export class CarListComponent implements OnInit, OnDestroy {
  private _isLoading: boolean = false
  private _cars: ObservableArray<Car> = new ObservableArray<Car>([])
  private _dataSubscription: Subscription

  constructor(private _carService: CarService, private _routerExtensions: RouterExtensions,
              private _modal: ModalDialogService,private _vcRef: ViewContainerRef) {}

  ngOnInit(): void {
    if (!this._dataSubscription) {
      this._isLoading = true

      this._dataSubscription = this._carService
        .load()
        .pipe(finalize(() => (this._isLoading = false)))
        .subscribe((cars: Array<Car>) => {
          this._cars = new ObservableArray(cars)
          this._isLoading = false
        })
    }
  }

  ngOnDestroy(): void {
    if (this._dataSubscription) {
      this._dataSubscription.unsubscribe()
      this._dataSubscription = null
    }
  }

  get cars(): ObservableArray<Car> {
    return this._cars
  }

  get isLoading(): boolean {
    return this._isLoading
  }

  async onCarItemTap(args: ListViewEventData): Promise<void> {
    const tappedCarItem = args.view.bindingContext
    let options = {
      context: {},
      fullscreen: false,
      viewContainerRef: this._vcRef,
      backdrop: "static"
    };

    const status = await this._modal.showModal(SimpleModal, options);
    if(status){
      // It is working if I delay 2 seconds. However I think there should be a better way
      // to check whether the modal is finished completely.
      // setTimeout(() => {
      //   this._routerExtensions.navigate(['/cars/car-detail', tappedCarItem.id], {
      //   animated: true,
      //   transition: {
      //     name: 'slide',
      //     duration: 200,
      //     curve: 'ease',
      //   }
      // })},2000);
    }
  }
}
