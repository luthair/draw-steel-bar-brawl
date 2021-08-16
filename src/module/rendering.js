import { getBars, getBar, getVisibleBars, getDefaultBar, getNewBarId } from "./api.js";
import BarConfigExtended from "./extendedConfig.js";

/**
 * Extends the original Token.drawBars() with custom bar rendering. 
 *  The original function is not called. If available, the libWrapper module is
 *  used for better compatibility.
 */
export const extendBarRenderer = function () {
    if (game.modules.get("lib-wrapper")?.active) {
        // Override using libWrapper: https://github.com/ruipin/fvtt-lib-wrapper
        libWrapper.register("barbrawl", "Token.prototype.drawBars", drawBrawlBars, "OVERRIDE");
        libWrapper.register("barbrawl", "TokenDocument.prototype.getBarAttribute",
            function (wrapped, barId, { alternative } = {}) {
                return wrapped(null, {
                    alternative: alternative ?? getBar(this, barId)?.attribute
                });
            }, "WRAPPER");
    } else {
        // Manual override
        Token.prototype.drawBars = drawBrawlBars;

        const originalGetBarAttribute = TokenDocument.prototype.getBarAttribute;
        TokenDocument.prototype.getBarAttribute = function (barId, { alternative } = {}) {
            return originalGetBarAttribute.call(this, null, {
                alternative: alternative ?? getBar(this, barId)?.attribute
            });
        };
    }
}

/**
 * Modifies the given HTML to replace the resource bar configuration with our
 *  own template.
 * @param {TokenConfig} tokenConfig The token configuration object.
 * @param {jQuery} html The jQuery element of the token configuration.
 * @param {Object} data The data of the token configuration.
 */
export const extendTokenConfig = async function (tokenConfig, html, data) {
    data.brawlBars = getBars(tokenConfig.token);

    const barConfiguration = await renderTemplate("modules/barbrawl/templates/token-resources.hbs", data);

    const resourceTab = html.find("div[data-tab='resources']");
    resourceTab.find("div.form-fields").parent().remove();
    resourceTab.append(barConfiguration);
    if (resourceTab.hasClass("active")) adjustConfigHeight(html, data.brawlBars.length);

    html.find(".brawlbar-add").click(event => onAddResource(event, tokenConfig, data));
    html.find(".brawlbar-save").click(() => onSaveDefaults(tokenConfig));
    html.find(".brawlbar-load").click(() => onLoadDefaults(tokenConfig, data));
    html.on("change", ".brawlbar-attribute", onChangeBarAttribute.bind(tokenConfig.token));
    html.on("click", ".brawlbar-extend", event => onOpenAdvancedConfiguration(event, data));
}

/**
 * Handles an attribute selection change event by updating the resource value.
 * @constant {TokenConfig} this The token configuration that this function is bound to.
 * @param {jQuery.Event} event The event of the selection change.
 */
export const onChangeBarAttribute = function (event) {
    const barId = event.target.name.split(".")[3];
    let form = event.target.form;
    if (!form.classList.contains("brawlbar-configuration")) form = form.querySelector("#" + barId);
    if (!form) return;

    const valueInput = form.querySelector(`input.${barId}-value`);
    const maxInput = form.querySelector(`input.${barId}-max`);

    if (event.target.value === "custom") {
        valueInput.removeAttribute("disabled");
        maxInput.removeAttribute("disabled");
        if (maxInput.value === "") maxInput.value = valueInput.value;
        form.querySelectorAll(`input.ignore-limit`).forEach(el => {
            el.removeAttribute("disabled");
            el.checked = false;
        });
    } else {
        valueInput.setAttribute("disabled", "");
        form.querySelectorAll(`input.ignore-limit`).forEach(el => {
            el.setAttribute("disabled", "");
            el.checked = true;
        });

        const resource = this.getBarAttribute(null, { alternative: event.target.value });
        if (resource === null) {
            valueInput.value = maxInput.value = "";
            maxInput.setAttribute("disabled", "");
        } else if (resource.type === "bar") {
            valueInput.value = resource.value;
            maxInput.value = resource.max;
            maxInput.setAttribute("disabled", "");
        } else {
            valueInput.value = resource.value;
            maxInput.value = "";
            maxInput.removeAttribute("disabled");
        }
    }
}

/**
 * Opens an application with additional configuration options.
 * @param {jQuery.Event} event The event of the button click.
 * @param {Object} data The data of the request.
 */
function onOpenAdvancedConfiguration(event, data) {
    const barId = event.currentTarget.parentElement.parentElement.id;
    const barData = data.brawlBars.find(bar => bar.id === barId);
    if (!barData) return;

    new BarConfigExtended(barData, {
        parent: data.object.document,
        displayModes: data.displayModes,
        barAttributes: data.barAttributes
    }).render(true);
    return false;
}

/**
 * Handles an add button click event by adding another resource.
 * @param {jQuery.Event} event The event of the button click.
 * @param {TokenConfig} tokenConfig The token configuration object.
 * @param {Object} data The data of the token configuration.
 */
async function onAddResource(event, tokenConfig, data) {
    const barControls = $(event.currentTarget.parentElement);
    const htmlBars = barControls.siblings("details");
    const newBar = getDefaultBar(getNewBarId(htmlBars), "custom");
    data.brawlBars.push(newBar);

    const barConfiguration = await renderTemplate("modules/barbrawl/templates/bar-config.hbs", {
        brawlBars: [newBar],
        displayModes: data.displayModes,
        barAttributes: data.barAttributes
    });
    if (htmlBars.length > 0) {
        htmlBars[htmlBars.length - 1].removeAttribute("open");
    }
    adjustConfigHeight(tokenConfig.element, 1);
    barControls.before(barConfiguration);
}

/**
 * Handles a save button click by storing the current resource configuration in
 *  the user configuration.
 * @param {TokenConfig} tokenConfig The token configuration object.
 */
async function onSaveDefaults(tokenConfig) {
    const html = tokenConfig.element;
    if (!html?.length) return;

    const formData = tokenConfig._getSubmitData();
    let data = {};
    for (let [key, value] of Object.entries(formData)) {
        if (key.startsWith("flags.barbrawl")) data[key] = value;
    }

    await game.settings.set("barbrawl", "defaultResources", expandObject(data).flags.barbrawl.resourceBars);
    ui.notifications.info("Bar Brawl | " + game.i18n.localize("barbrawl.saveConfirmation"));
}

/**
 * Handles a load button click by updating the token with the default bar
 *  configuration and re-rendering the config application.
 * @param {TokenConfig} tokenConfig The token configuration object.
 */
async function onLoadDefaults(tokenConfig) {
    const defaults = game.settings.get("barbrawl", "defaultResources");
    if (!defaults) {
        ui.notifications.error("Bar Brawl | " + game.i18n.localize("barbrawl.noDefaults"));
        return;
    }

    await tokenConfig.token.update({ "flags.barbrawl.resourceBars": defaults }, { diff: false });
    return tokenConfig.render();
}

/**
 * Adjusts the height of the given container to account for additional bar
 *  configuration sections.
 * @param {jQuery.Element} html The JQuery element of the token configuration.
 * @param {number} additionalBars The number of additional bars to account for.
 */
function adjustConfigHeight(html, additionalBars) {
    if (additionalBars <= 0) return;
    const height = parseInt(html.css("height"), 10);
    html.css("height", (additionalBars * 17) + Math.max(height, 434) + "px");
}

/**
 * Modifies the given HTML to render additional resource input fields.
 * @param {TokenHUD} tokenHud The HUD object.
 * @param {jQuery} html The jQuery element of the token HUD.
 * @param {Object} data The data of the token HUD.
 */
export const extendTokenHud = async function (tokenHud, html, data) {
    let visibleBars = getVisibleBars(tokenHud.object.document, false);
    data["topBars"] = visibleBars.filter(bar => bar.position.startsWith("top"));
    data["bottomBars"] = visibleBars.filter(bar => bar.position.startsWith("bottom")).reverse();

    let resourceInputs = await renderTemplate("modules/barbrawl/templates/resource-hud.hbs", data);
    let middleColumn = html.find(".col.middle");
    middleColumn.html(resourceInputs);
    middleColumn.find(".attribute input")
        .click(tokenHud._onAttributeClick)
        .keydown(tokenHud._onAttributeKeydown.bind(tokenHud))
        .change(updateBarAttribute.bind(tokenHud));
}

/**
 * Handles a token HUD input change event by applying the value to the resource.
 * @param {jQuery.Event} event The event of the value change.
 */
function updateBarAttribute(event) {
    if (!this.object) return; // HUD has already been closed.

    const input = event.currentTarget;
    if (input.dataset.bar) return this._onAttributeUpdate(event);

    // Workaround for https://gitlab.com/foundrynet/foundryvtt/-/issues/5606
    const data = this.object.data;
    data[input.name] = foundry.utils.getProperty(this.object.data, input.name);
    const rv = this._onAttributeUpdate(event);
    delete data[input.name];
    return rv;
}

/**
 * Creates rendering objects for each of the token's resource bars.
 * @constant {Token} this The token that this function is called on.
 */
function drawBrawlBars() {
    this.bars.removeChildren();
    let visibleBars = getVisibleBars(this.document);
    if (visibleBars.length === 0) return;

    let positionCounts = [0, 0, 0, 0];
    for (let barData of visibleBars) {
        let barIndex = 0;
        switch (barData.position) {
            case "top-inner":
                barIndex = positionCounts[0]++;
                break;
            case "top-outer":
                barIndex = positionCounts[1]++;
                break;
            case "bottom-inner":
                barIndex = positionCounts[2]++;
                break;
            case "bottom-outer":
                barIndex = positionCounts[3]++;
        }
        this.bars.addChild(createResourceBar(this, barData, barIndex));
    }

    this.data.displayBars = CONST.TOKEN_DISPLAY_MODES.ALWAYS;
    this.bars.visible = this.bars.children.length > 0;
}

/**
 * Creates a rendering object for a single resource bar.
 * @param {Token} token The token on which to create the bar.
 * @param {Object} data The object containing the bar's data.
 * @param {Number} index The amount of bars previously rendered at the same position.
 */
function createResourceBar(token, data, index) {
    // Create the rendering object
    let bar = new PIXI.Graphics();
    bar.name = data.id;
    if (!data.max) {
        bar.visible = false;
        return bar;
    }

    let height = drawResourceBar(token, bar, data);
    bar.position.set(0, calculatePosition(data.position, height, token.h, index));
    return bar;
}

/**
 * Redraws a single resource bar without changing its position.
 * @param {Token} token The token to redraw the bar on.
 * @param {Object} barData The data of the bar to refresh.
 */
export const redrawBar = function (token, barData) {
    const bar = token.bars.getChildByName(barData.id);
    if (bar) {
        bar.removeChildren();
        drawResourceBar(token, bar, barData);
    }
}

/**
 * Draws the geometry and colors calculated from the given data onto the given
 *  PIXI object.
 * @param {Token} token The token to draw the bar on.
 * @param {PIXI.Graphics} bar The graphics object to draw onto.
 * @param {Object} data The data of the bar to draw.
 * @returns {Number} The final height of the bar.
 */
function drawResourceBar(token, bar, data) {
    let width = token.w;
    let height = Math.max((canvas.dimensions.size / 12), 8);
    if (token.data.height >= 2) height *= 1.6;  // Enlarge the bar for large tokens

    const baseValue = data.invert ? data.max - data.value : data.value;
    let percentage = Math.clamped(baseValue, 0, data.max) / data.max;

    // Defer rendering to HP Bar module for compatibility.
    if (data.attribute === "attributes.hp" && game.modules.get("arbron-hp-bar")?.active) {
        const posY = bar.position.y; // Store position for bar redraws.
        token._drawBar(0, bar, data);
        bar.position.set(0, posY);
    } else {
        let color = interpolateColor(data.mincolor, data.maxcolor, percentage);

        // Draw the bar itself
        switch (game.settings.get("barbrawl", "barStyle")) {
            case "minimal":
                height -= 2;
                drawMinimalBar(bar, width, height, percentage, color);
                break;
            case "default":
                drawDefaultBar(bar, width, height, percentage, color);
                break;
            case "large":
                height += 2;
                drawLargeBar(bar, width, height, percentage, color);
                break;
            default:
                console.error(`barbrawl | Unknown bar style ${game.settings.get("barbrawl", "barStyle")}.`);
        }
    }

    // Draw the label (if any)
    let textStyle = data.style;
    if (!textStyle || textStyle === "user") textStyle = game.settings.get("barbrawl", "textStyle");
    switch (textStyle) {
        case "none":
            const existingLabel = bar.getChildByName(bar.name + "-text");
            if (existingLabel) bar.removeChild(existingLabel);
            break;
        case "fraction":
            drawBarLabel(bar, width, height, `${data.value} / ${data.max}`);
            break;
        case "percent":
            drawBarLabel(bar, width, height, `${Math.round(percentage * 100)}%`);
            break;
        default:
            console.error(`barbrawl | Unknown label style ${game.settings.get("barbrawl", "textStyle")}.`);
    }

    // Update visibility.
    bar.visible = token._canViewMode(data.visibility);

    return height;
}

/**
 * Draws a bar using the default style with thick, rounded borders.
 * @param {PIXI.Graphics} bar The graphics object to draw onto.
 * @param {Number} width The target width of the bar.
 * @param {Height} height The target height of the bar.
 * @param {Number} percentage How far the bar should be filled.
 * @param {String} color The color to fill the bar with.
 */
function drawDefaultBar(bar, width, height, percentage, color) {
    const strokeWidth = Math.clamped(height / 8, 1, 2);
    bar.clear()
        .beginFill(0x000000, 0.5)
        .lineStyle(strokeWidth, 0x000000, 1.0)
        .drawRoundedRect(0, 0, width, height, 3);
    if (percentage <= 0.01) return;
    bar.beginFill(color, 1.0)
        .lineStyle(strokeWidth, 0x000000, 1.0)
        .drawRoundedRect(0, 0, percentage * width, height, 2);
}

/**
 * Draws a bar without borders.
 * @param {PIXI.Graphics} bar The graphics object to draw onto.
 * @param {Number} width The target width of the bar.
 * @param {Height} height The target height of the bar.
 * @param {Number} percentage How far the bar should be filled.
 * @param {String} color The color to fill the bar with.
 */
function drawMinimalBar(bar, width, height, percentage, color) {
    bar.clear()
        .beginFill(0x000000, 0.2)
        .drawRect(0, 0, width, height)
        .beginFill(color, 0.8)
        .drawRect(0, 0, percentage * width, height);
}

/**
 * Draws a bar with a thin border.
 * @param {PIXI.Graphics} bar The graphics object to draw onto.
 * @param {Number} width The target width of the bar.
 * @param {Height} height The target height of the bar.
 * @param {Number} percentage How far the bar should be filled.
 * @param {String} color The color to fill the bar with.
 * @param {Number} value The current value of the resource.
 * @param {Number} max The maximum value of the resource.
 */
function drawLargeBar(bar, width, height, percentage, color) {
    bar.clear()
        .beginFill(0x000000, 0.5)
        .lineStyle(1, 0x000000, 0.9)
        .drawRoundedRect(0, 0, width, height, 2)
        .beginFill(color, 0.8)
        .lineStyle(0)
        .drawRoundedRect(0.5, 0.5, percentage * (width - 1), height - 1, 1);
}

/**
 * Adds a PIXI.Text object on top of the given graphics object.
 * @param {PIXI.Graphics} bar The PIXI object to add the text to.
 * @param {Number} width The width of the bar.
 * @param {Number} height The height of the bar.
 * @param {String} text The text to display.
 */
function drawBarLabel(bar, width, height, text) {
    let font = CONFIG.canvasTextStyle.clone();
    font.fontSize = height;

    let barText = new PIXI.Text(text, font);
    barText.name = bar.name + "-text";
    barText.x = width / 2;
    barText.y = height / 2;
    barText.anchor.set(0.5);
    barText.resolution = 1.5;
    bar.addChild(barText);
}

/**
 * Interpolates two RGB hex colors to get a midway point at the given
 *  percentage. The colors are converted into the HSV space to produce more
 *  intuitive results.
 * @param {String} minColor The lowest color as RGB hex string.
 * @param {String} maxColor The highest color as RGB hex string.
 * @param {Number} percentage The interpolation interval.
 * @returns {String} The interpolated color as RBG hex string.
 */
function interpolateColor(minColor, maxColor, percentage) {
    let minRgb = PIXI.utils.hex2rgb(PIXI.utils.string2hex(minColor));
    let maxRgb = PIXI.utils.hex2rgb(PIXI.utils.string2hex(maxColor));

    let minHsv = rgb2hsv(minRgb[0], minRgb[1], minRgb[2]);
    let maxHsv = rgb2hsv(maxRgb[0], maxRgb[1], maxRgb[2]);

    let deltaHue = maxHsv[0] - minHsv[0];
    let deltaAngle = deltaHue + ((Math.abs(deltaHue) > 180) ? ((deltaHue < 0) ? 360 : -360) : 0);

    let targetHue = minHsv[0] + deltaAngle * percentage;
    let targetSaturation = (1 - percentage) * minHsv[1] + percentage * maxHsv[1];
    let targetValue = (1 - percentage) * minHsv[2] + percentage * maxHsv[2];

    return PIXI.utils.rgb2hex(hsv2rgb(targetHue, targetSaturation, targetValue));
}

/**
 * Converts a color from RGB to HSV space.
 * Source: https://stackoverflow.com/questions/8022885/rgb-to-hsv-color-in-javascript/54070620#54070620
 * @param {Number} r The red value of the color as float (0 to 1).
 * @param {Number} g The green value of the color as float (0 to 1).
 * @param {Number} b The blue value of the color as float (0 to 1).
 * @returns {Number[]} The HSV color with hue in degrese (0 to 360), saturation and value as float (0 to 1).
 */
function rgb2hsv(r, g, b) {
    let v = Math.max(r, g, b), c = v - Math.min(r, g, b);
    let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c));
    return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

/**
 * Converts a color from HSV to RGB space.
 * Source: https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately/54024653#54024653
 * @param {Number} h The hue of the color in degrees (0 to 360).
 * @param {Number} s The saturation of the color as float (0 to 1).
 * @param {Number} v The value of the color as float (0 to 1).
 * @returns {Number[]} The RGB color with each component as float (0 to 1).
 */
function hsv2rgb(h, s, v) {
    let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)];
}

/**
 * Calculates the vertical coordinate of the bar with the given position
 *  relative to the token's boundaries.
 * @param {String} positionType The configured position indicator.
 * @param {Number} barHeight The height of the rendered bar.
 * @param {Number} tokenHeight The height of the rendered token.
 * @param {Number} index The amount of bars previously rendered at the same position.
 * @returns {Number} The Y-coordinate of the bar.
 */
function calculatePosition(positionType, barHeight, tokenHeight, index) {
    switch (positionType) {
        case "top-inner": return barHeight * index;
        case "top-outer": return barHeight * (index + 1) * -1;
        case "bottom-inner": return tokenHeight - barHeight * (index + 1);
        case "bottom-outer": return tokenHeight + barHeight * index;
    }
}
