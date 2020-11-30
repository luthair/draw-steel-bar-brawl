/**
 * This is the entry file for the FoundryVTT module to configure resource bars.
 * @author Adrian Haberecht
 */

import { extendBarRenderer, extendTokenConfig, extendTokenHud, redrawBar } from "./module/rendering.js";
import { registerSettings } from "./module/settings.js";
import { synchronizeBars } from "./module/synchronization.js";

/** Hook to register settings. */
Hooks.once('init', async function() {
	console.log('barbrawl | Initializing barbrawl');

	registerSettings();

	Handlebars.registerHelper("isLinkedBar", function(bar) {
		return bar.attribute !== "custom";
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
Hooks.on("renderTokenConfig", function(tokenConfig, html, data) {
	extendTokenConfig(tokenConfig, html, data);
});

/** Hook to remove bars and synchronize legacy bars. */
Hooks.on("preUpdateToken", function(_scene, tokenData, newData) {
	// Always make the bar container visible
	if (tokenData.displayBars !== CONST.TOKEN_DISPLAY_MODES.ALWAYS) {
		newData["displayBars"] = CONST.TOKEN_DISPLAY_MODES.ALWAYS;
	}
	
	// Remove bars that were explicitly set to "None" attribute
	let changedBars = getProperty(newData, "flags.barbrawl.resourceBars");
	if (changedBars) {
		for (let barId of Object.keys(changedBars)) {
			if (barId.startsWith("-=")) continue; // Already queued for removal

			let bar = changedBars[barId];
			if (bar.attribute === "") {
				delete changedBars[barId];
				changedBars["-=" + barId] = null;
			}
		}
	}

	synchronizeBars(tokenData, newData);
});

/** Hook to update bars. */
Hooks.on("updateToken", function(_scene, tokenData, diffData) {
	let token = canvas.tokens.get(tokenData._id);
	if (!token) return;

	if ("bar1" in diffData || "bar2" in diffData) {
		if (token.hasActiveHUD) canvas.tokens.hud.render();
		return;
	}

	if (!hasProperty(diffData, "flags.barbrawl.resourceBars")) return;

	// Check if only one bar value was changed (not added or removed)
	let changedBars = diffData.flags.barbrawl.resourceBars;
	let changedBarIds = Object.keys(changedBars);
	if (changedBarIds.length === 1 && !changedBarIds.some(id => id.startsWith("-="))) {
		let changedData = changedBars[changedBarIds[0]];
		if (!changedData.position && !changedData.id) {
			redrawBar(token, tokenData.flags.barbrawl.resourceBars[changedBarIds[0]]);

			// Update HUD
			if (token.hasActiveHUD && changedData.value) {
				let valueInput = canvas.tokens.hud._element.find(`input[data-bar='${changedBarIds[0]}']`);
				if (valueInput) valueInput.val(changedData.value);
			}
			return;
		}
	}

	// Otherwise, completely redraw all bars
	token.drawBars();
	if (token.hasActiveHUD) canvas.tokens.hud.render();
});

/** Hook to update bar visibility on hover */
Hooks.on("hoverToken", function(token) {
	let resourceBars = getProperty(token.data, "flags.barbrawl.resourceBars");
	if (!resourceBars) return;

	let barContainer = token.bars.children;
	for (let pixiBar of barContainer) {
		let bar = resourceBars[pixiBar.name];
		if (bar) pixiBar.visible = token._canViewMode(bar.visibility);
	}
});