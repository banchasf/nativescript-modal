import { Component, OnInit } from "@angular/core";
import { ModalDialogParams } from '@nativescript/angular';

@Component({
  selector: "SimpleModal",
  moduleId: module.id,
  template: `
    <StackLayout height="100" verticalAlignment="center">
      <Button class="m-0" text="Tap to proceed" (tap)="onSelect($event)" row="0" col="2"></Button>
    </StackLayout>
    `,
})
export class SimpleModal implements OnInit {

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
