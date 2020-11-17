/**
 * Synchronizes resource bars to and from FoundryVTT's format with Bar Brawl.
 * @param {Object} newData The data to be merged into the token data.
 */
export const synchronizeBars = function(newData) {
    let hasLegacyBars = hasProperty(newData, "bar1") || hasProperty(newData, "bar2");

    if (!hasProperty(newData, "flags.barbrawl.resourceBars")) {
        setProperty(newData, "flags.barbrawl.resourceBars", {});
    } else {
        synchronizeBrawlBar("bar1", newData);
        synchronizeBrawlBar("bar2", newData);
    }

    if (hasLegacyBars) {
        synchronizeLegacyBar("bar1", newData);
        synchronizeLegacyBar("bar2", newData);
    }
}

/**
 * Merges the state of a changed Bar Brawl resource bar into FoundryVTT.
 * @param {String} barId The name of the bar to synchronize.
 * @param {Object} foundryData The data to be merged into the token data.
 */
function synchronizeBrawlBar(barId, foundryData) {
    let brawlBarData = foundryData.flags.barbrawl.resourceBars[barId];
    if (!brawlBarData) return;

    foundryData[barId] = { attribute: brawlBarData.attribute };
}

/**
 * Merges the state of a changed FoundryVTT resource bar with Bar Brawl.
 * @param {String} barId The name of the bar to synchronize.
 * @param {Object} foundryData The data to be merged into the token data.
 */
function synchronizeLegacyBar(barId, foundryData) {
    let foundryBarData = foundryData[barId];
    if (!foundryBarData) return;

    let brawlBars = foundryData.flags.barbrawl.resourceBars;
    let brawlBarData = brawlBars[barId];

    if (brawlBarData) {
        if (Object.keys(foundryBarData).length === 0) {
            delete brawlBars[barId];
        } else {
            brawlBarData.attribute = foundryBarData.attribute;
        }
    } else {
        var bottomBar = barId === "bar1";
        brawlBars[barId] = {
            id: barId,
            mincolor: bottomBar ? "FF0000" : "000080",
            maxcolor: bottomBar ? "80FF00" : "80B3FF",
            position: bottomBar ? "bottom-inner" : "top-inner",
            attribute: foundryBarData.attribute,
            visibility: CONST.TOKEN_DISPLAY_MODES.OWNER
        };
    }
}