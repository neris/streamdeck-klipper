import { action, KeyDownEvent } from "@elgato/streamdeck";
import { BaseAction, BaseActionSettings } from "./BaseAction";

@action({ UUID: "com.nerisexe.klipper.resume-print" })
export class ResumePrint<T extends ResumePrintSettings = ResumePrintSettings> extends BaseAction<T> {

	constructor() {
		super();
	}

	override async onKeyDown(ev: KeyDownEvent<T>): Promise<void> {
		await this.makeRequest(ev.payload.settings, 'post', '/printer/print/resume');
		ev.action.showOk();
	}
}

export interface ResumePrintSettings extends BaseActionSettings {
};
