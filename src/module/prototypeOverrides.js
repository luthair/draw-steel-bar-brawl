/**
 * Resets bar display overrides in the prototype override setting and hides associated configuration elements.
 */
export function adjustPrototypeOverrides() {
    const setting = foundry.data.PrototypeTokenOverrides.SETTING
    const overrides = game.settings.get("core", setting);
    let changed = false;
    for (const type of Actor.TYPES) {
        const typeOverrides = overrides[type];
        if (typeOverrides && typeOverrides.displayBars !== undefined) {
            changed = true;
            typeOverrides.displayBars = undefined;
            console.warn(`Bar Brawl | Resetting global bar visibility override for ${type}.`);
        }
    }

    if (changed) {
        const overrideData = foundry.data.PrototypeTokenOverrides.schema.clean(overrides);
        foundry.data.PrototypeTokenOverrides.schema.validate(overrideData);
        game.settings.set("core", setting, overrideData);
    }

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