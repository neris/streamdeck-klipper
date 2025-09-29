import { action, KeyDownEvent } from "@elgato/streamdeck";
import { BaseAction, BaseActionSettings } from "./BaseAction";

@action({ UUID: "com.nerisexe.klipper.pause-print" })
export class PausePrint<T extends PausePrintSettings = PausePrintSettings> extends BaseAction<T> {

	constructor() {
		super();
	}

	override async onKeyDown(ev: KeyDownEvent<T>): Promise<void> {
		await this.makeRequest(ev.payload.settings, 'post', '/printer/print/pause');
		ev.action.showOk();
	}
}

export interface PausePrintSettings extends BaseActionSettings {
};
