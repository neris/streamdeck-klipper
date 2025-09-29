import streamDeck, { action, DialAction, DidReceiveSettingsEvent, KeyAction, KeyDownEvent, WillAppearEvent } from "@elgato/streamdeck";
import IconTemplate from "../icons/IconTemplate";
import { BaseUpdatableAction, BaseUpdatableActionSettings } from "./BaseUpdatableAction";

@action({ UUID: "com.nerisexe.klipper.printer-status" })
export class PrinterStatus<T extends PrinterStatusSettings = PrinterStatusSettings> extends BaseUpdatableAction<T> {

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
			iconStyle: settings.iconStyle,
			iconColor: settings.standbyColor,
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
		const json = await this.makeRequest(settings, 'get', '/printer/objects/query?webhooks&print_stats&display_status');

		const webhooks = json?.result?.status?.webhooks;
		const printStats = json?.result?.status?.print_stats;
		const displayStatus = json?.result?.status?.display_status;

		let iconStyle = settings.iconStyle;
		let iconColor = settings.standbyColor;
		let showProgressbar = settings.showProgressbar;
		let state = '';
		let progress: number|undefined = undefined;
		let detailsLine1 = '';
		let detailsLine2 = '';

		if (webhooks && webhooks.state != 'ready') {
			iconColor = settings.errorColor ?? 'red';
			state = webhooks.state.charAt(0).toUpperCase() + webhooks.state.slice(1);
			detailsLine1 = webhooks.state_message;
		} else if (printStats) {
			state = printStats.state.charAt(0).toUpperCase() + printStats.state.slice(1);

			if (printStats.state === 'printing') {
				iconColor = settings.printingColor ?? '#7c00ba';
				if (displayStatus) {
					progress = displayStatus.progress * 100.0;
				}

				detailsLine1 = this.renderDetailsLine(settings.detailsLine1Data ?? [], printStats, displayStatus);
				detailsLine2 = this.renderDetailsLine(settings.detailsLine2Data ?? [], printStats, displayStatus);
			} else if (printStats.state === 'paused') {
				iconColor = settings.pausedColor ?? '#bd880d';
			} else if (printStats.state === 'complete') {
				iconColor = settings.completeColor ?? '#20bd0f';
			} else if (printStats.state === 'error') {
				iconColor = settings.errorColor ?? 'red';
				detailsLine1 = printStats.message;
			} else {
				// standby, cancelled
			}
		}

		const svg = IconTemplate({ iconStyle, iconColor, state, progress, detailsLine1, detailsLine2, showProgressbar } );
		action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
	}

	private renderDetailsLine(dataSources: string[], printStats: any, displayStatus?: any): string {
		let data = [];
		if (dataSources?.includes('layers')) {
			data.push(printStats.info.current_layer + '/' + printStats.info.total_layer);
		}
		if (dataSources?.includes('printTime')) {
			data.push((printStats.total_duration / 60).toFixed(0) + "m");
		}
		if (dataSources?.includes('filename')) {
			data.push(printStats.filename);
		}
		if (dataSources?.includes('statusMessage')) {
			data.push(printStats.message);
		}
		if (dataSources?.includes('displayMessage')) {
			data.push(displayStatus?.message);
		}

		return data.join(' ');
	}
}

export interface PrinterStatusSettings extends BaseUpdatableActionSettings {
	standbyColor?: string;
	printingColor?: string;
	pausedColor?: string;
	completeColor?: string;
	errorColor?: string;
	detailsLine1Data?: string[];
	detailsLine2Data?: string[];
	showProgressbar?: boolean;
	keyAction?: string;
	keyActionUrl?: string;
	gcode?: string;
};
