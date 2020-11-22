/**
 * Synchronizes resource bars to and from FoundryVTT's format with Bar Brawl.
 * @param {Object} tokenData The data to merge the new data into.
 * @param {Object} newData The data to be merged into the token data.
 */
export const synchronizeBars = function(tokenData, newData) {
    let hasLegacyBars = hasProperty(newData, "bar1") || hasProperty(newData, "bar2");
    let hasBrawlBars = hasProperty(newData, "flags.barbrawl.resourceBars");

    if (hasBrawlBars) {
        synchronizeBrawlBar("bar1", newData);
        synchronizeBrawlBar("bar2", newData);
    }

    if (hasLegacyBars) {
        if (!hasBrawlBars) setProperty(newData, "flags.barbrawl.resourceBars", {});

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
    if (!brawlBarData || !brawlBarData.attribute) return;

    newData[barId] = { attribute: brawlBarData.attribute };
}

/**
 * Merges the state of a changed FoundryVTT resource bar with Bar Brawl.
 * @param {String} barId The name of the bar to synchronize.
 * @param {Object} tokenData The data to merge the new data into.
 * @param {Object} newData The data to be merged into the token data.
 */
function synchronizeLegacyBar(barId, tokenData, newData) {
    let foundryBarData = newData[barId];
    if (!foundryBarData) return;

    let brawlBars = getProperty(tokenData, "flags.barbrawl.resourceBars") ?? {};
    let brawlBarChanges = newData.flags.barbrawl.resourceBars;
    let brawlBarData = brawlBars[barId];

    if (brawlBarData) {
        if (Object.keys(foundryBarData).length === 0) {
            // Remove the bar
            brawlBarChanges["-=" + barId] = null;
        } else {
            // Change the attribute
            brawlBarChanges[barId].attribute = foundryBarData.attribute;
        }
    } else {
        // Create a new bar with default values
        var bottomBar = barId === "bar1";
        brawlBarChanges[barId] = {
            id: barId,
            mincolor: bottomBar ? "FF0000" : "000080",
            maxcolor: bottomBar ? "80FF00" : "80B3FF",
            position: bottomBar ? "bottom-inner" : "top-inner",
            attribute: foundryBarData.attribute,
            visibility: CONST.TOKEN_DISPLAY_MODES.OWNER
        };
    }
}