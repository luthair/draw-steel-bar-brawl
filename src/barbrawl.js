/**
 * This is the entry file for the FoundryVTT module to configure resource bars.
 * @author Adrian Haberecht
 */

import { extendBarRenderer, extendTokenConfig, extendTokenHud } from "./module/rendering.js";
import { synchronizeBars } from "./module/synchronization.js";

/** Hook to register settings. */
Hooks.once('init', async function() {
	console.log('barbrawl | Initializing barbrawl');

	// Global class registrations
	// window.CounterTypes = CounterTypes;

	// Register custom module settings
	// registerSettings();

	Handlebars.registerHelper("isLinkedBar", function(bar) {
		return bar.attribute !== "custom";
	});

	Handlebars.registerHelper("debug", function(bar) {
		console.warn(bar);
		return;
	});
});

/** Hook to replace the token bar rendering. */
Hooks.once("setup", function() {
	extendBarRenderer();
});

/** Hook to apply custom keybinds to the token HUD. */
Hooks.on("renderTokenHUD", function(tokenHud, html, data) {
	extendTokenHud(tokenHud, html, data);
});

/** Hook to replace the resource bar configuration menu. */
Hooks.on("renderTokenConfig", function(_tokenConfig, html, data) {
	extendTokenConfig(html, data);
});

/** Hook to synchronize status counters and effects. */
Hooks.on("preUpdateToken", function(_scene, _tokenData, newData) {
	if (_tokenData.displayBars !== CONST.TOKEN_DISPLAY_MODES.ALWAYS) {
		newData["displayBars"] = CONST.TOKEN_DISPLAY_MODES.ALWAYS;
	}

	synchronizeBars(newData);
});

/** Hook to update status counters without redrawing all effects. */
Hooks.on("updateToken", function(_scene, tokenData, diffData) {
	if ("bar1" in diffData || "bar2" in diffData || !hasProperty(diffData, "flags.barbrawl.resourceBars")) return;

	canvas.tokens.get(tokenData._id)?.drawBars();
});