/**
 * This is the entry file for the FoundryVTT module to configure resource bars.
 * @author Adrian Haberecht
 */

import { extendBarRenderer, redrawBar } from "./module/rendering.js";
import { extendTokenConfig } from "./module/config.js";
import { extendTokenHud } from "./module/hud.js";
import { getDefaultResources, registerSettings } from "./module/settings.js";
import { createOverrideData, prepareUpdate } from "./module/synchronization.js";
import { refreshBarVisibility } from "./module/api.js";

/** Hook to register settings. */
Hooks.once('init', async function () {
    console.log('barbrawl | Initializing barbrawl');

    registerSettings();
    Handlebars.registerHelper("barbrawl-concat", function () {
        let output = "";
        for (let input of arguments) {
            if (typeof input !== "object") output += input;
        }
        return output;
    });

    loadTemplates(["modules/barbrawl/templates/bar-config-minimal.hbs", "modules/barbrawl/templates/bar-config.hbs"]);
});

/** Hooks to replace UI elements. */
Hooks.once("setup", extendBarRenderer);
Hooks.on("renderTokenHUD", extendTokenHud);
Hooks.on("renderTokenConfig", extendTokenConfig);

/** Hook to remove bars and synchronize legacy bars. */
Hooks.on("preUpdateToken", function (doc, changes) {
    prepareUpdate(doc.data, changes);
});

/** Hook to apply changes to the prototype token. */
Hooks.on("preUpdateActor", function (actor, newData) {
    if (!hasProperty(newData, "token.flags.barbrawl.resourceBars")) return;
    prepareUpdate(actor.data.token, newData.token);
});

/** Hook to update bars. */
Hooks.on("updateToken", function (doc, changes) {
    const token = doc.object;
    if (!token) return;

    if ("bar1" in changes || "bar2" in changes) {
        if (token.hasActiveHUD) canvas.tokens.hud.render();
        return;
    }

    if (!hasProperty(changes, "flags.barbrawl.resourceBars")) return;

    // Check if only one bar value was changed (not added or removed)
    let changedBars = changes.flags.barbrawl.resourceBars;
    let changedBarIds = Object.keys(changedBars);
    if (changedBarIds.length === 1 && !changedBarIds.some(id => id.startsWith("-="))) {
        let changedData = changedBars[changedBarIds[0]];
        if (!(["position", "id", "max", "indentLeft", "indentRight", "bgImage", "fgImage",
            "ownerVisibility", "otherVisibility"].some(prop => prop in changedData))) {
            const barData = doc.data.flags.barbrawl.resourceBars[changedBarIds[0]];

            if (barData.attribute !== "custom") {
                const resource = doc.getBarAttribute(null, { alternative: barData.attribute });
                if (!resource || (resource.type !== "bar" && !barData.max)) return;
                else barData.value = resource.value;
            } else if (!barData.max) {
                return;
            }

            redrawBar(token, barData);

            // Update HUD
            if (token.hasActiveHUD && changedData.value) {
                let valueInput = canvas.tokens.hud._element
                    .find(`input[name='flags.barbrawl.resourceBars.${changedBarIds[0]}.value']`);
                if (valueInput) valueInput.val(changedData.value);
            }
            return;
        }
    }

    // Otherwise, completely redraw all bars
    token.drawBars();
    if (token.hasActiveHUD) canvas.tokens.hud.render();
});

/** Hooks to initialize tokens and actors with default bars. */
Hooks.on("preCreateToken", function (doc, data) {
    // Always make the bar container visible.
    doc.data.update({ displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS });

    const actor = game.actors.get(data.actorId);
    if (!actor || hasProperty(actor.data, "token.flags.barbrawl.resourceBars")) return; // Don't override prototype.

    const barConfig = getDefaultResources(actor.type);
    if (!barConfig) return;
    doc.data.update(createOverrideData(barConfig));
});

Hooks.on("preCreateActor", function (doc) {
    if (!doc.data.token || foundry.utils.hasProperty(doc.data.token, "flags.barbrawl.resourceBars")) return;

    const barConfig = getDefaultResources(doc.type);
    if (!barConfig) return;
    doc.data.update(createOverrideData(barConfig, true));
});

/** Hook to update bar visibility. */
Hooks.on("hoverToken", refreshBarVisibility);
Hooks.on("controlToken", refreshBarVisibility);

Hooks.once("ready", function () {
    if (game.i18n.lang === "ja" && !game.modules.get("foundryVTTja")?.active) {
        const message = "Bar Brawl | " + game.i18n.localize("barbrawl.localization-moved");
        ui.notifications.warn(message);
        console.warn(message);
    }
});