/**
 * This is the entry file for the FoundryVTT module to configure resource bars.
 * @author Adrian Haberecht
 */

import { extendBarRenderer, extendTokenConfig, extendTokenHud, redrawBar } from "./module/rendering.js";
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

/** Hook to replace the resource value inputs. */
Hooks.on("renderTokenHUD", function(tokenHud, html, data) {
	extendTokenHud(tokenHud, html, data);
});

/** Hook to replace the resource bar configuration menu. */
Hooks.on("renderTokenConfig", function(_tokenConfig, html, data) {
	extendTokenConfig(html, data);
});

/** Hook to remove bars and synchronize legacy bars. */
Hooks.on("preUpdateToken", function(_scene, tokenData, newData) {
	if (tokenData.displayBars !== CONST.TOKEN_DISPLAY_MODES.ALWAYS) {
		newData["displayBars"] = CONST.TOKEN_DISPLAY_MODES.ALWAYS;
	}
	
	// Remove bars that were explicitly set to "None" attribute
	let changedBars = getProperty(newData, "flags.barbrawl.resourceBars");
	if (changedBars) {
		for (let barId of Object.keys(changedBars)) {
			let bar = changedBars[barId];
			if (bar.attribute === "") {
				delete changedBars[barId];
				changedBars["-=" + barId] = null;
			}
		}
	}

	// synchronizeBars(tokenData, newData, changeBars);
});

/** Hook to update bars. */
Hooks.on("updateToken", function(_scene, tokenData, diffData) {
	if ("bar1" in diffData || "bar2" in diffData || !hasProperty(diffData, "flags.barbrawl.resourceBars")) return;

	let token = canvas.tokens.get(tokenData._id);
	if (!token) return;

	// Check if only one bar value was changed (not added or removed)
	let changedBars = diffData.flags.barbrawl.resourceBars;
	let changedBarIds = Object.keys(changedBars);
	if (changedBarIds.length === 1 && !changedBarIds.some(id => id.startsWith("-="))) {
		let changedData = changedBars[changedBarIds[0]];
		if (!changedData.position && !changedData.id) {
			redrawBar(token, tokenData.flags.barbrawl.resourceBars[changedBarIds[0]]);
			return;
		}
	}

	// Otherwise, completely redraw all bars
	token.drawBars();
});