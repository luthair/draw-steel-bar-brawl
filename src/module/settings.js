/**
 * Registers the settings used by this module.
 */
export const registerSettings = function() {
	game.settings.register("barbrawl", "barStyle", {
		name: game.i18n.localize("barbrawl.barStyle.name"),
		hint: game.i18n.localize("barbrawl.barStyle.hint"),
		scope: "client",
		config: true,
		type: String,
		choices: {
			"minimal": "barbrawl.barStyle.minimal",
			"default": "barbrawl.barStyle.default",
			"large": "barbrawl.barStyle.large"
		},
		default: "default",
		onChange: updateBars
	});

	game.settings.register("barbrawl", "textStyle", {
		name: game.i18n.localize("barbrawl.textStyle.name"),
		hint: game.i18n.localize("barbrawl.textStyle.hint"),
		scope: "client",
		config: true,
		type: String,
		choices: {
			"none": "barbrawl.textStyle.none",
			"fraction": "barbrawl.textStyle.fraction",
			"percent": "barbrawl.textStyle.percent"
		},
		default: "none",
		onChange: updateBars
	});
}

/**
 * Refreshes the bars of all tokens to apply the new style.
 */
function updateBars() {
	for (let token of canvas.tokens.placeables) token.drawBars();
}
