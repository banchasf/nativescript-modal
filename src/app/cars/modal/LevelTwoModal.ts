import { Component, OnInit } from "@angular/core";
import { ModalDialogParams } from '@nativescript/angular';

@Component({
  selector: "LevelOneModal",
  moduleId: module.id,
  template: `
    <StackLayout height="100" verticalAlignment="center">
      <Label text="Modal Level 2"></Label>
      <Button class="m-0" text="Tap to proceed" (tap)="onSelect($event)" row="0" col="2"></Button>
    </StackLayout>
    `,
})
export class LevelTwoModal implements OnInit {

  constructor(
    private params: ModalDialogParams,
  ) {
  }

  ngOnInit(): void {
  }

  onSelect(args: any) {
    // this.navigateToStaffList()
    this.params.closeCallback(true);
  }

}
