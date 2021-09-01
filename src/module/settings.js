/**
 * Registers the settings used by this module.
 */
export const registerSettings = function () {
    game.settings.register("barbrawl", "barStyle", {
        name: game.i18n.localize("barbrawl.barStyle.name"),
        hint: game.i18n.localize("barbrawl.barStyle.hint"),
        scope: "client",
        config: true,
        type: String,
        choices: {
            "minimal": "barbrawl.barStyle.minimal",
            "default": "barbrawl.barStyle.default",
            "large": "barbrawl.barStyle.large",
            "legacy": "barbrawl.barStyle.legacy"
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

    game.settings.register("barbrawl", "defaultResources", {
        name: "Default token resources",
        hint: "",
        scope: "world",
        config: false,
        type: Object,
        default: {}
    });

    // Register hook to add a reset button to the settings.
    Hooks.on("renderSettingsConfig", function (_settingsConfig, html, options) {
        if (!options.canConfigure) return

        // Find our settings block.
        const barbrawlConfig = html.find("select[name='barbrawl.textStyle']").parent().parent();
        if (!barbrawlConfig?.length) return;

        // Add the reset button.
        barbrawlConfig.after(`
            <div class="form-group">
                <label>${game.i18n.localize("barbrawl.reset.name")}</label>
                <div class="form-fields">
                    <button class="barbrawl-reset" type="button">
                        <i class="fas fa-undo"></i>
                        <label>${game.i18n.localize("barbrawl.reset.button")}</label>
                    </button>
                </div>
                <p class="notes">${game.i18n.localize("barbrawl.reset.hint")}</p>
            </div>`
        );

        // Connect the button.
        barbrawlConfig.parent().find("button.barbrawl-reset").click(async () => {
            await game.settings.set("barbrawl", "defaultResources", null);
            ui.notifications.info("Bar Brawl | " + game.i18n.localize("barbrawl.resetConfirmation"))
        });
    });
}

/**
 * Refreshes the bars of all tokens to apply the new style.
 */
function updateBars() {
    for (let token of canvas.tokens.placeables) token.drawBars();
}
