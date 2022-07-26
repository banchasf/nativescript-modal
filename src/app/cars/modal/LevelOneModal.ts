import {Component, OnInit, ViewContainerRef} from "@angular/core";
import { ModalDialogParams } from '@nativescript/angular';
import {MerxModalDialogService} from "../MerxModalDialogService";
import {LevelTwoModal} from "./LevelTwoModal";

@Component({
  selector: "LevelOneModal",
  moduleId: module.id,
  template: `
    <StackLayout height="100" verticalAlignment="center">
      <Label text="Modal Level 1"></Label>
      <Button class="m-0" text="Tap to proceed" (tap)="onSelect($event)" row="0" col="2"></Button>
    </StackLayout>
    `,
})
export class LevelOneModal implements OnInit {

  constructor(
    private params: ModalDialogParams,
    private _vcRef: ViewContainerRef,
    private _modal: MerxModalDialogService
  ) {
  }

  ngOnInit(): void {
  }

  async onSelect(args: any) {
    let options = {
      context: {},
      fullscreen: false,
      viewContainerRef: this._vcRef,
      backdrop: "static",
      disableNavigation: true
    };

    await this._modal.showModal(LevelTwoModal, options);
    // this.navigateToStaffList()
    this.params.closeCallback(true);
  }

}
