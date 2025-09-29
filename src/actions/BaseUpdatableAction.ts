import { DialAction, DidReceiveSettingsEvent, KeyAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { BaseAction, BaseActionSettings } from "./BaseAction";

export abstract class BaseUpdatableAction<T extends BaseUpdatableActionSettings> extends BaseAction<T> {
	private timers: { [id: string]: NodeJS.Timeout } = {};

	constructor() {
		super();
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<T>): Promise<void> | void {
		super.onDidReceiveSettings(ev);
		this.startAutoUpdate(ev.action, ev.payload.settings);
	}

	override async onWillAppear(ev: WillAppearEvent<T>): Promise<void> {
		super.onWillAppear(ev);
		this.startAutoUpdate(ev.action, ev.payload.settings);
	}

	override async onWillDisappear(ev: WillDisappearEvent<T>): Promise<void> {
		this.stopAutoUpdate(ev.action.id);
	}

	private startAutoUpdate(action: KeyAction<T> | DialAction<T>, settings: T) {
		this.stopAutoUpdate(action.id);

		if (settings.updateInterval && settings.updateInterval > 0) {
			this.timers[action.id] = setInterval(() => {
				this.onAutoUpdate(action, settings);
			}, settings.updateInterval * 1000);
		}
	}

	private stopAutoUpdate(actionId: string) {
		if (this.timers[actionId] !== undefined) {
			clearInterval(this.timers[actionId]);
			delete this.timers[actionId];
		}
	}

	abstract onAutoUpdate(action: KeyAction<T> | DialAction<T>, settings: T): Promise<void>;
}

export interface BaseUpdatableActionSettings extends BaseActionSettings {
	updateInterval?: number;
};
