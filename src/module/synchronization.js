import { getBars, getDefaultBar } from "./api.js";

/**
 * Synchronizes resource bars to and from FoundryVTT's format with Bar Brawl.
 * @param {Object} tokenData The data to merge the new data into.
 * @param {Object} newData The data to be merged into the token data.
 */
export const synchronizeBars = function(tokenData, newData) {
    let hasLegacyBars = newData.hasOwnProperty("bar1") || newData.hasOwnProperty("bar2");
    let hasBrawlBars = hasProperty(newData, "flags.barbrawl.resourceBars");

    if (hasBrawlBars) {
        synchronizeBrawlBar("bar1", tokenData, newData);
        synchronizeBrawlBar("bar2", tokenData, newData);
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
 * @param {Object} tokenData The data to merge the new data into.
 * @param {Object} newData The data to be merged into the token data.
 */
function synchronizeBrawlBar(barId, tokenData, newData) {
    let brawlBarData = newData.flags.barbrawl.resourceBars[barId];
    if (brawlBarData && !tokenData[barId]?.attribute) {
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
    let foundryBarData = newData[barId];
    if (!foundryBarData) return;

    let brawlBars = getProperty(tokenData, "flags.barbrawl.resourceBars") ?? {};
    let brawlBarChanges = newData.flags.barbrawl.resourceBars;
    let brawlBarData = brawlBars[barId];
    let remove = Object.keys(foundryBarData).length === 0 || foundryBarData.attribute === "";

    if (brawlBarData) {
        if (remove) {
            // Remove the bar
            brawlBarChanges["-=" + barId] = null;
        } else {
            // Change the attribute
            setProperty(brawlBarChanges, barId + ".attribute", foundryBarData.attribute);
        }
    } else if (!remove) {
        // Create a new bar with default values
        brawlBarChanges[barId] = getDefaultBar(barId, foundryBarData.attribute);
    }
}

/**
 * Checks the given data for any attributes that have a resource bar and redraws
 *  the bars if any are found.
 * @constant {Token} this The token that this function is called on.
 * @param {Object} newData The data to be merged into the token data.
 */
export const onUpdateAttributes = function(newData) {
    let update = getBars(this).some(bar => hasProperty(newData, "data." + bar.attribute));
    if (update) this.drawBars();
}

/**
 * Handles a resource input change event by updating the associated attribute.
 *  This is essentially a variant of Foundry's _onAttributeUpdate function which
 *  we can not use because of its inflexible design.
 * @constant {TokenHUD} this The token HUD that this function is bound to.
 * @param {jQuery.Event} event The event of the input change.
 */
export const onChangeBarValue = function(event) {
    event.preventDefault();
    if (!this.object) return;

    let dataset = event.currentTarget.dataset;
    let bar = getBars(this.object).find(bar => bar.id === dataset.bar);
    if (!bar) return;

    // Parse input
    let stringValue = event.currentTarget.value.trim();
    let isDelta = stringValue.startsWith("+") || stringValue.startsWith("-");
    if (stringValue.startsWith("=")) stringValue = stringValue.slice(1);
    let value = Number(stringValue);

    let actor = this.object.actor;
    if (bar.attribute === "custom" || !actor) {
        // Update the token for custom values or unlinked tokens
        value = Math.clamped(0, isDelta ? bar.value + value : value, bar.max ?? Number.MAX_VALUE);
        this.object.update({ [`flags.barbrawl.resourceBars.${bar.id}.value`]: value });
    } else {
        // Otherwise, update the actor
        let resource = this.object.getBarAttribute(null, { alternative: bar.attribute });
        actor.modifyTokenAttribute(resource.attribute, value, isDelta, resource.type === "bar");
    }

    // Clear the HUD
    this.clear();
}