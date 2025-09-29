import { action, KeyDownEvent } from "@elgato/streamdeck";
import { BaseAction, BaseActionSettings } from "./BaseAction";

@action({ UUID: "com.nerisexe.klipper.cancel-print" })
export class CancelPrint<T extends CancelPrintSettings = CancelPrintSettings> extends BaseAction<T> {

	constructor() {
		super();
	}

	override async onKeyDown(ev: KeyDownEvent<T>): Promise<void> {
		await this.makeRequest(ev.payload.settings, 'post', '/printer/print/cancel');
		ev.action.showOk();
	}
}

export interface CancelPrintSettings extends BaseActionSettings {
};
