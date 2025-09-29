import { action, KeyDownEvent } from "@elgato/streamdeck";
import { BaseAction, BaseActionSettings } from "./BaseAction";

@action({ UUID: "com.nerisexe.klipper.run-gcode" })
export class RunGCode<T extends RunGCodeSettings = RunGCodeSettings> extends BaseAction<T> {

	constructor() {
		super();
	}

	override async onKeyDown(ev: KeyDownEvent<T>): Promise<void> {
		if (!ev.payload.settings.gcode) {
			return;
		}

		await this.makeRequest(ev.payload.settings, 'post', '/printer/gcode/script', {
			script: ev.payload.settings.gcode,
		});

		ev.action.showOk();
	}
}

export interface RunGCodeSettings extends BaseActionSettings {
	gcode?: string;
};
