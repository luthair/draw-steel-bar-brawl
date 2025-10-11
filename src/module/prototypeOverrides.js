/**
 * Resets bar display overrides in the prototype override setting and hides associated configuration elements.
 */
export function adjustPrototypeOverrides() {
    const setting = foundry.data.PrototypeTokenOverrides.SETTING
    const overrides = game.settings.get("core", setting);
    for (const type of Actor.TYPES) {
        const typeOverrides = overrides[type];
        if (typeOverrides) typeOverrides.displayBars = undefined;
    }

    game.settings.set("core", setting, overrides);

    Hooks.on("renderPrototypeOverridesConfig", hideDisplayBarsOverride);
}

/**
 * Removes bar display selections from the displayed configuration.
 * The value of these fields will be set to their default, which is undefined.
 * @param {HTMLElement} html The rendered overrides configuration.
 */
function hideDisplayBarsOverride(_app, html, _context, _options) {
    for (const el of html.querySelectorAll("select[name$='displayBars']")) {
        el.closest(".form-group").remove();
    }
}