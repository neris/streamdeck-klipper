import { action, KeyDownEvent } from "@elgato/streamdeck";
import { BaseAction, BaseActionSettings } from "./BaseAction";

@action({ UUID: "com.nerisexe.klipper.start-print" })
export class StartPrint<T extends StartPrintSettings = StartPrintSettings> extends BaseAction<T> {

	constructor() {
		super();
	}

	override async onKeyDown(ev: KeyDownEvent<T>): Promise<void> {
		if (!ev.payload.settings.filename) {
			return;
		}

		await this.makeRequest(ev.payload.settings, 'post', '/printer/print/start?filename=' + ev.payload.settings.filename);

		ev.action.showOk();
	}
}

export interface StartPrintSettings extends BaseActionSettings {
	filename?: string;
};
