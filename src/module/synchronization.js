import { getDefaultBar } from "./rendering.js";

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
        brawlBarChanges[barId] = getDefaultBar(barId, foundryBarData.attribute);
    }
}

/**
 * Checks the given data for any attributes that have a resource barand redraws
 *  the bars if any are found.
 * @constant {Token} this The token that this function is called on.
 * @param {Object} newData The data to be merged into the token data.
 */
export const onUpdateAttributes = function(newData) {
    let resourceBars = getProperty(this.data, "flags.barbrawl.resourceBars");
    if (!resourceBars) return;

    let update = Object.values(resourceBars).some(bar => hasProperty(newData, "data." + bar.attribute));
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
    let bar = this.object.data.flags.barbrawl.resourceBars[dataset.bar];
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