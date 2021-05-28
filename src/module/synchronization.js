import { getDefaultBar } from "./api.js";

/**
 * Prepares the update of a token (or a prototype token) by removing invalid
 *  resources and synchronizing with FoundryVTT's resource format.
 * @param {Object} tokenData The data to merge the new data into.
 * @param {Object} newData The data to be merged into the token data.
 */
export const prepareUpdate = function (tokenData, newData) {
    // Always make the bar container visible.
    if (tokenData._source.displayBars !== CONST.TOKEN_DISPLAY_MODES.ALWAYS) {
        newData["displayBars"] = CONST.TOKEN_DISPLAY_MODES.ALWAYS;
    }

    const changedBars = foundry.utils.getProperty(newData, "flags.barbrawl.resourceBars");
    if (changedBars) {
        for (let barId of Object.keys(changedBars)) {
            // Remove bars that were explicitly set to "None" attribute.
            if (barId.startsWith("-=")) continue; // Already queued for removal

            let bar = changedBars[barId];
            if (bar.attribute === "") {
                delete changedBars[barId];
                changedBars["-=" + barId] = null;
            }

            // Clamp values.
            if (bar.hasOwnProperty("value")) {
                const barData = (foundry.utils.getProperty(tokenData, "flags.barbrawl.resourceBars") ?? {})[barId];
                if (barData && !barData.ignoreMin) bar.value = Math.max(0, bar.value);
                if (barData && !barData.ignoreMax && barData.max) bar.value = Math.min(barData.max, bar.value);
            }
        }
    }
    synchronizeBars(tokenData, newData);
}

/**
 * Synchronizes resource bars to and from FoundryVTT's format with Bar Brawl.
 * @param {Object} tokenData The data to merge the new data into.
 * @param {Object} newData The data to be merged into the token data.
 */
function synchronizeBars(tokenData, newData) {
    let hasLegacyBars = newData.hasOwnProperty("bar1") || newData.hasOwnProperty("bar2");
    let hasBrawlBars = hasProperty(newData, "flags.barbrawl.resourceBars");

    if (hasBrawlBars) {
        synchronizeBrawlBar("bar1", newData);
        synchronizeBrawlBar("bar2", newData);
    }

    if (hasLegacyBars) {
        if (!hasBrawlBars) foundry.utils.setProperty(newData, "flags.barbrawl.resourceBars", {});

        synchronizeLegacyBar("bar1", tokenData, newData);
        synchronizeLegacyBar("bar2", tokenData, newData);
    }
}

/**
 * Merges the state of a changed Bar Brawl resource bar into FoundryVTT.
 * @param {String} barId The name of the bar to synchronize.
 * @param {Object} newData The data to be merged into the token data.
 */
function synchronizeBrawlBar(barId, newData) {
    let brawlBarData = newData.flags.barbrawl.resourceBars[barId];
    if (brawlBarData?.attribute) {
        newData[barId] = { attribute: brawlBarData.attribute };
    } else if (newData.flags.barbrawl.resourceBars["-=" + barId] === null) {
        newData[barId] = { attribute: "" };
    }
}

/**
 * Merges the state of a changed FoundryVTT resource bar with Bar Brawl.
 * @param {String} barId The name of the bar to synchronize.
 * @param {Object} tokenData The data to merge the new data into.
 * @param {Object} newData The data to be merged into the token data.
 */
function synchronizeLegacyBar(barId, tokenData, newData) {
    const foundryBarData = newData[barId];
    if (!foundryBarData) return;

    const brawlBars = foundry.utils.getProperty(tokenData, "flags.barbrawl.resourceBars") ?? {};
    const brawlBarChanges = newData.flags.barbrawl.resourceBars;
    const brawlBarData = brawlBars[barId];
    const remove = Object.keys(foundryBarData).length === 0 || foundryBarData.attribute === "";

    if (brawlBarData) {
        if (remove) {
            // Remove the bar
            brawlBarChanges["-=" + barId] = null;
        } else {
            // Change the attribute
            foundry.utils.setProperty(brawlBarChanges, barId + ".attribute", foundryBarData.attribute);
        }
    } else if (!remove) {
        // Create a new bar with default values
        brawlBarChanges[barId] = getDefaultBar(barId, foundryBarData.attribute);
    }
}