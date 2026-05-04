import streamDeck, { DialAction, DidReceiveSettingsEvent, KeyAction, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import IconTemplate, { IconTemplateOptions } from "../icons/IconTemplate";

export abstract class BaseAction<T extends BaseActionSettings> extends SingletonAction<T> {

	constructor() {
		super();
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<T>): Promise<void> | void {
		this.setInitialIcon(ev.action, ev.payload.settings);
	}

	override async onWillAppear(ev: WillAppearEvent<T>): Promise<void> {
		this.setInitialIcon(ev.action, ev.payload.settings);
	}

	async setInitialIcon(action: KeyAction<T> | DialAction<T>, settings: T): Promise<void> {
		this.setIconFromTemplate(action, {
			iconStyle: settings.iconStyle,
			iconColor: settings.iconColor,
		});
	}

	async setIconFromTemplate(action: KeyAction<T> | DialAction<T>, iconOptions: IconTemplateOptions): Promise<void> {
		const svg = IconTemplate(iconOptions);
		action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
	}

	async makeRequest(settings: T, method: string, endpoint: string, data: object | undefined = undefined): Promise<any> {
		try {
			let url = settings.moonrakerUrl?.replace(/\/$/, "");
			if (!url) {
				return null;
			}

			const response = await fetch(url + endpoint, {
				method: method,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: data === undefined ? undefined : JSON.stringify(data),
			});
			if (!response.ok) {
				streamDeck.logger.error('Failed to fetch:', response.status);
			}

			const json: any = await response.json();
			streamDeck.logger.debug(json);

			return json;

		} catch (e) {
			streamDeck.logger.error('Failed to fetch:', e);
			return null;
		}
	}
}

export interface BaseActionSettings extends JsonObject {
	moonrakerUrl?: string;
	iconStyle?: string;
	iconColor?: string;
};
