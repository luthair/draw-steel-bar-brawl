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
 * @constant {TokenHUD} this The token HUD that this function is bound to.
 * @param {jQuery.Event} event The event of the input change.
 */
export const onChangeBarValue = function(event) {
    event.preventDefault();
    if (!this.object) return;

    // Fetch the bar data.
    const dataset = event.currentTarget.dataset;
    const bar = getBars(this.object).find(bar => bar.id === dataset.bar);
    if (!bar) return;

    // Resolve the resource if needed.
    const actor = this.object.actor;
    const useToken = bar.attribute === "custom" || !actor;
    let resource = useToken ? null : this.object.getBarAttribute(null, { alternative: bar.attribute });

    // Parse input value.
    let stringValue = event.currentTarget.value.trim();
    let isDelta = stringValue.startsWith("+") || stringValue.startsWith("-");
    if (stringValue.startsWith("=")) stringValue = stringValue.slice(1);
    let value = Number(stringValue);

    // Resolve and add current value for delta inputs.
    if (isDelta) {
        let currentValue;
        if (actor) {
            const current = getProperty(actor.data.data, resource.attribute);
            currentValue = resource.type === "bar" ? current.value : current;
        } else {
            currentValue = bar.value ?? 0;
        }

        value = currentValue + value;
    }

    // Clamp value unless explicitly disabled.
    if (!bar.ignoreMin) value = Math.max(0, value);
    if (!bar.ignoreMax && bar.max) value = Math.min(bar.max, value);

    // Update the token for custom values or unlinked tokens.
    if (useToken) this.object.update({ [`flags.barbrawl.resourceBars.${bar.id}.value`]: value });
    else actor.modifyTokenAttribute(resource.attribute, value, false, resource.type === "bar");

    // Clear the HUD
    this.clear();
}