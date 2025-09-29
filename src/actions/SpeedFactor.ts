import { action, KeyAction, DialAction, TouchTapEvent, DidReceiveSettingsEvent, WillAppearEvent, DialRotateEvent, DialDownEvent } from "@elgato/streamdeck";
import debounce from 'debounce';
import { BaseUpdatableAction, BaseUpdatableActionSettings } from "./BaseUpdatableAction";
import IconTemplate, { IconTemplateOptions } from "../icons/IconTemplate";

@action({ UUID: "com.nerisexe.klipper.speed-factor" })
export class SpeedFactor<T extends SpeedFactorSettings = SpeedFactorSettings> extends BaseUpdatableAction<T> {
	requestUpdateDebounce: debounce.DebouncedFunction<(newValue: number, action: KeyAction | DialAction, settings: T) => Promise<void>>;

	constructor() {
		super();
		this.requestUpdateDebounce = debounce(this.requestUpdate, 500);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<T>): Promise<void> | void {
		super.onDidReceiveSettings(ev);
	}

	override async onWillAppear(ev: WillAppearEvent<T>): Promise<void> {
		super.onWillAppear(ev);
		this.updateStatus(ev.action, ev.payload.settings);
	}

	override async setIconFromTemplate(action: KeyAction<T> | DialAction<T>, iconOptions: IconTemplateOptions): Promise<void> {
		const svg = IconTemplate(iconOptions);
		action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);

		if (action.isDial()) {
			action.setFeedback({
				icon: `data:image/svg+xml,${encodeURIComponent(svg)}`,
			});
		}
	}

	override async onAutoUpdate(action: KeyAction<T> | DialAction<T>, settings: T): Promise<void> {
		this.updateStatus(action, settings);
	}

	override async onTouchTap(ev: TouchTapEvent<T>): Promise<void> {
		this.updateStatus(ev.action, ev.payload.settings);
	}

	override async onDialRotate(ev: DialRotateEvent<T>): Promise<void> {
		let value: number = (ev.payload.settings?.lastValue ?? ev.payload.settings?.defaultValue ?? 100) as number;
		value += ev.payload.ticks as number;
		value = Math.max(1, Math.min(value, 200));

		ev.action.setSettings({
			...ev.payload.settings,
			lastValue: value,
		});
		ev.action.setFeedback({
			value: `${value}%*`,
		});
		this.requestUpdateDebounce(value, ev.action, ev.payload.settings)
	}

	override async onDialDown(ev: DialDownEvent<T>): Promise<void> {
		let value: number = (ev.payload.settings?.defaultValue ?? 100) as number;
		ev.action.setSettings({
			...ev.payload.settings,
			lastValue: value,
		});
		ev.action.setFeedback({
			value: `${value}%*`,
		});
		this.requestUpdateDebounce(value, ev.action, ev.payload.settings)
	}

	private async requestUpdate(newValue: number, action: KeyAction | DialAction, settings: T) {
		await this.makeRequest(settings, 'post', '/printer/gcode/script', {
			script: `M220 S${newValue}`,
		});

		this.updateStatus(action, settings);
	}

	private async updateStatus(action: KeyAction | DialAction, settings: T) {
		if (!action.isDial()) return;

		const json = await this.makeRequest(settings, 'get', '/printer/objects/query?gcode_move');

		const speedFactor = json?.result?.status?.gcode_move?.speed_factor;
		if (!speedFactor) {
			return;
		}

		const value = Math.ceil(parseFloat(speedFactor) * 100.0);

		action.setSettings({
			...settings,
			lastValue: value,
		});
		action.setFeedback({
			value: `${value}%`,
		});
	}
}

export interface SpeedFactorSettings extends BaseUpdatableActionSettings {
	lastValue?: number;
	defaultValue?: number;
};
