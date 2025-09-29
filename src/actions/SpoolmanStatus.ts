import streamDeck, { action, DialAction, DidReceiveSettingsEvent, KeyAction, KeyDownEvent, WillAppearEvent } from "@elgato/streamdeck";
import IconTemplate from "../icons/IconTemplate";
import { BaseUpdatableAction, BaseUpdatableActionSettings } from "./BaseUpdatableAction";

@action({ UUID: "com.nerisexe.klipper.spoolman-status" })
export class SpoolmanStatus<T extends SpoolmanStatusSettings = SpoolmanStatusSettings> extends BaseUpdatableAction<T> {

	constructor() {
		super();
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<T>): Promise<void> | void {
		super.onDidReceiveSettings(ev);
		this.updateStatus(ev.action, ev.payload.settings);
	}

	override async onWillAppear(ev: WillAppearEvent<T>): Promise<void> {
		super.onWillAppear(ev);
		this.updateStatus(ev.action, ev.payload.settings);
	}

	override async setInitialIcon(action: KeyAction<T> | DialAction<T>, settings: T): Promise<void> {
		this.setIconFromTemplate(action, {
			iconStyle: 'spoolman',
		});
	}

	override async onKeyDown(ev: KeyDownEvent<T>): Promise<void> {
		const keyAction = ev.payload.settings.keyAction ?? 'update';
		if (keyAction === 'update') {
			this.updateStatus(ev.action, ev.payload.settings);

		} else if (keyAction === 'openUrl' && ev.payload.settings.keyActionUrl) {
			streamDeck.system.openUrl(ev.payload.settings.keyActionUrl);

		} else if (keyAction === 'gcode' && ev.payload.settings.gcode) {
			await this.makeRequest(ev.payload.settings, 'post', '/printer/gcode/script', {
				script: ev.payload.settings.gcode,
			});

			ev.action.showOk();
		}
	}

	async onAutoUpdate(action: KeyAction<T> | DialAction<T>, settings: T): Promise<void> {
		this.updateStatus(action, settings);
	}

	private async updateStatus(action: KeyAction | DialAction, settings: T) {
		const moonrakerInfo = await this.makeRequest(settings, 'get', '/server/spoolman/spool_id');
		const spoolId = parseInt(moonrakerInfo?.result?.spool_id, 10);
		if (!spoolId) {
			return;
		}

		const spoolmanInfo = await this.makeRequest(settings, 'post', '/server/spoolman/proxy', {
			'request_method': 'GET',
			'path': `/v1/spool/${spoolId}`,
		});

		let iconStyle = 'spoolman';
		let iconColor = spoolmanInfo?.result?.filament?.color_hex;
		let state = '';
		let progress: number | undefined = undefined;
		let detailsLine1 = '';
		let detailsLine2 = '';

		const usedWeight = parseFloat(spoolmanInfo?.result?.used_weight ?? 0);
		const initialWeight = parseFloat(spoolmanInfo?.result?.initial_weight ?? spoolmanInfo?.result?.filament?.weight ?? 0);
		if (initialWeight > 0) {
			progress = (1.0 - (usedWeight / initialWeight)) * 100.0;
			detailsLine1 = `${(initialWeight - usedWeight).toFixed(0)}/${initialWeight.toFixed(0)}g`;
		}

		detailsLine2 = spoolmanInfo?.result?.filament?.name;

		const svg = IconTemplate({ iconStyle, iconColor, state, progress, detailsLine1, detailsLine2 } );
		action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
	}
}

export interface SpoolmanStatusSettings extends BaseUpdatableActionSettings {
	keyAction?: string;
	keyActionUrl?: string;
	gcode?: string;
};
