/**
 * Retreives all resource bars of the given token.
 * @param {Token} token The token to fetch the bars for.
 * @returns {Object[]} An array of bar data.
 */
export const getBars = function(token) {
    let resourceBars = getProperty(token.data, "flags.barbrawl.resourceBars") ?? {};
    let barArray = Object.values(resourceBars);

    if (token.data.bar1?.attribute && !resourceBars.bar1)
        barArray.push(getDefaultBar("bar1", token.data.bar1.attribute));
    if (token.data.bar2?.attribute && !resourceBars.bar2)
        barArray.push(getDefaultBar("bar2", token.data.bar2.attribute));
    return barArray;
}

/**
 * Retreives all resource bars of the given token that are currently visible.
 * @param {Token} token The token to fetch the bars for.
 * @param {Boolean} barsOnly Flag indicating whether single values should be excluded. Defaults to true.
 * @returns {Object[]} An array of visible bar data.
 */
export const getVisibleBars = function(token, barsOnly = true) {
    let visibleBars = [];

    for (let bar of getBars(token)) {
        // Don't filter with visibility if we need all resources
        if (barsOnly) {
            // Skip never displayed bars
            if (bar.visibility === CONST.TOKEN_DISPLAY_MODES.NONE) continue;
    
            // Skip bars displayed only for the owner if we don't own it
            if ((bar.visibility === CONST.TOKEN_DISPLAY_MODES.OWNER
                || bar.visibility === CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER)
                && !token.owner)
                continue;
        }
        
         // Add custom bars (can only be set on token)
         if (bar.attribute === "custom") {
            visibleBars.push(bar);
            continue;
        }

        // Update resource values
        let resource = token.getBarAttribute(null, { alternative: bar.attribute?.toString() });
        if (!resource || (barsOnly && resource.type !== "bar" && !bar.max)) continue;

        bar.value = resource.value;
        bar.max = resource.max ?? bar.max;

        // Check visibility
        visibleBars.push(bar);
    }

    return visibleBars;
}

/**
 * Creates an ID for a new bar, which is either 'bar1' for the first, 'bar2'
 *  for the second or a random ID for any subsequent bar.
 * @param {Object[]} existingBars The array of existing bar data.
 */
export const getNewBarId = function(existingBars) {
    switch (existingBars.length) {
        case 0: return "bar1";
        case 1: return "bar2";
        default: return "b" + randomID();
    }
}

/**
 * Creates a new bar data object with default settings depending on the given ID.
 * @param {String} id The ID of the bar.
 * @param {String} attribute The attribute of the bar.
 */
export const getDefaultBar = function(id, attribute) {
    let defaultBar = {
        id: id,
        attribute: attribute,
        visibility: CONST.TOKEN_DISPLAY_MODES.OWNER,
        mincolor: "#000000",
        maxcolor: "#FFFFFF",
        position: "bottom-inner",
        style: "user",
        ignoreMin: true,
        ignoreMax: true,
        invert: false
    }

    if (attribute === "custom") {
        defaultBar.value = 10;
        defaultBar.max = 10;
    }

    if (id === "bar1") {
        defaultBar.mincolor = "#FF0000";
        defaultBar.maxcolor = "#80FF00";
    } else if (id === "bar2") {
        defaultBar.position = "top-inner";
        defaultBar.mincolor = "#000080";
        defaultBar.maxcolor = "#80B3FF";
    }

    return defaultBar;
}