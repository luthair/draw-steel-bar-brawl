import { getBars, getDefaultBar } from "./api.js";

/**
 * Prepares the update of a token (or a prototype token) by removing invalid
 *  resources and synchronizing with FoundryVTT's resource format.
 * @param {Object} tokenData The data to merge the new data into.
 * @param {Object} newData The data to be merged into the token data.
 */
export const prepareUpdate = function (tokenData, newData) {
    // Always make the bar container visible
    if (tokenData.displayBars !== CONST.TOKEN_DISPLAY_MODES.ALWAYS) {
        newData["displayBars"] = CONST.TOKEN_DISPLAY_MODES.ALWAYS;
    }

    // Remove bars that were explicitly set to "None" attribute
    let changedBars = getProperty(newData, "flags.barbrawl.resourceBars");
    if (changedBars) {
        for (let barId of Object.keys(changedBars)) {
            if (barId.startsWith("-=")) continue; // Already queued for removal

            let bar = changedBars[barId];
            if (bar.attribute === "") {
                delete changedBars[barId];
                changedBars["-=" + barId] = null;
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
    const resource = useToken ? null : this.object.document.getBarAttribute(null, { alternative: bar.attribute });

    // Parse input value.
    let stringValue = event.currentTarget.value.trim();
    const isDelta = stringValue.startsWith("+") || stringValue.startsWith("-");
    if (stringValue.startsWith("=")) stringValue = stringValue.slice(1);
    let value = Number(stringValue);

    // Resolve and add current value for delta inputs.
    if (isDelta) {
        let currentValue;
        if (useToken) {
            currentValue = bar.value ?? 0;
        } else {
            const current = getProperty(actor.data.data, resource.attribute);
            currentValue = resource.type === "bar" ? current.value + (current.temp ?? 0) : current;
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