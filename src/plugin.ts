import streamDeck from "@elgato/streamdeck";

import { PrinterStatus } from "./actions/PrinterStatus";
import { SpoolmanStatus } from "./actions/SpoolmanStatus";
import { RunGCode } from "./actions/RunGCode";
import { StartPrint } from "./actions/StartPrint";
import { PausePrint } from "./actions/PausePrint";
import { ResumePrint } from "./actions/ResumePrint";
import { CancelPrint } from "./actions/CancelPrint";
import { SpeedFactor } from "./actions/SpeedFactor";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel("trace");

// Register actions
streamDeck.actions.registerAction(new PrinterStatus());
streamDeck.actions.registerAction(new SpoolmanStatus());
streamDeck.actions.registerAction(new RunGCode());
streamDeck.actions.registerAction(new StartPrint());
streamDeck.actions.registerAction(new PausePrint());
streamDeck.actions.registerAction(new ResumePrint());
streamDeck.actions.registerAction(new CancelPrint());
streamDeck.actions.registerAction(new SpeedFactor());

// Finally, connect to the Stream Deck.
streamDeck.connect();
