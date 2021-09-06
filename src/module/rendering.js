import { getBar, getVisibleBars } from "./api.js";

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
 * Creates rendering objects for each of the token's resource bars.
 * @constant {Token} this The token that this function is called on.
 */
function drawBrawlBars() {
    this.bars.removeChildren();
    let visibleBars = getVisibleBars(this.document);
    if (visibleBars.length === 0) return;

    const reservedSpace = {
        "top-inner": 0,
        "top-outer": 0,
        "bottom-inner": 0,
        "bottom-outer": 0,
        "left-inner": 0,
        "left-outer": 0,
        "right-inner": 0,
        "right-outer": 0
    };

    // Group inner bars by position.
    let maxLength = 0;
    const groupedBars = {
        "top-inner": [],
        "bottom-inner": [],
        "left-inner": [],
        "right-inner": [],
        "outer": []
    }

    for (let barData of visibleBars) {
        const pos = barData.position;
        if (pos.endsWith("outer")) {
            groupedBars.outer.push(barData);
            continue;
        }

        groupedBars[pos].push(barData);
        maxLength = Math.max(groupedBars[pos].length, maxLength); // Store highest count on one side.
    }

    // Render inner bars in sliced order.
    for (let i = 0; i < maxLength; i++) {
        createResourceBar(this, groupedBars["top-inner"][i], reservedSpace);
        createResourceBar(this, groupedBars["bottom-inner"][i], reservedSpace);
        createResourceBar(this, groupedBars["left-inner"][i], reservedSpace);
        createResourceBar(this, groupedBars["right-inner"][i], reservedSpace);
    }

    // Render outer bars sequentially.
    groupedBars["outer"].forEach(barData => createResourceBar(this, barData, reservedSpace));

    this.data.displayBars = CONST.TOKEN_DISPLAY_MODES.ALWAYS;
    this.bars.visible = this.bars.children.length > 0;
}

/**
 * Creates a rendering object for a single resource bar.
 * @param {Token} token The token on which to create the bar.
 * @param {Object} data The object containing the bar's data.
 * @param {Object} reservedSpace The amount of already used space per position.
 */
function createResourceBar(token, data, reservedSpace) {
    if (!data?.max) return;

    // Create the rendering object
    let bar = new PIXI.Graphics();
    bar.name = data.id;

    const width = calculateWidth(data, token, reservedSpace);
    const renderedHeight = drawResourceBar(token, bar, width, data);
    const position = calculatePosition(data, renderedHeight, token, reservedSpace);
    reservedSpace[data.position] += renderedHeight;
    bar.position.set(position[0], position[1]);
    token.bars.addChild(bar);
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
        drawResourceBar(token, bar, bar.width - bar.line.width, barData);
    }
}

/**
 * Draws the geometry and colors calculated from the given data onto the given
 *  PIXI object.
 * @param {Token} token The token to draw the bar on.
 * @param {PIXI.Graphics} bar The graphics object to draw onto.
 * @param {number} width The width of the bar.
 * @param {Object} data The data of the bar to draw.
 * @returns {number} The final height of the bar.
 */
function drawResourceBar(token, bar, width, data) {
    let height = Math.max((canvas.dimensions.size / 12), 8);
    if (token.data.height >= 2) height *= 1.6;  // Enlarge the bar for large tokens

    let labelValue = data.value;
    let labelMax = data.max;

    // Apply approximation.
    if (data.subdivisions) {
        labelValue = Math.ceil(labelValue / data.max * data.subdivisions);
        labelMax = data.subdivisions;
    }

    const barValue = data.invert ? labelMax - labelValue : labelValue;
    const barPercentage = Math.clamped(barValue, 0, labelMax) / labelMax;

    // Defer rendering to HP Bar module for compatibility.
    if (data.attribute === "attributes.hp" && game.modules.get("arbron-hp-bar")?.active) {
        const posY = bar.position.y; // Store position for bar redraws.
        token._drawBar(0, bar, data);
        bar.position.set(0, posY);
    } else {
        const color = interpolateColor(data.mincolor, data.maxcolor, barPercentage);
        const segments = data.subdivisions ? barValue : 1;

        // Draw the bar itself
        switch (game.settings.get("barbrawl", "barStyle")) {
            case "minimal":
                height -= 2;
                drawMinimalBar(bar, width, height, barPercentage, color, segments);
                break;
            case "default":
                drawRoundedBar(bar, width, height, barPercentage, color, segments, Math.clamped(height / 8, 1, 2), 2);
                break;
            case "large":
                height += 2;
                drawRoundedBar(bar, width, height, barPercentage, color, segments, 1, 2);
                break;
            case "legacy":
                drawRoundedBar(bar, width, height, barPercentage, color, segments, 2, 3);
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
            if (data.label) drawBarLabel(bar, width, height, data.label);
            break;
        case "fraction":
            drawBarLabel(bar, width, height, `${data.label ? data.label + "  " : ""}${labelValue} / ${labelMax}`);
            break;
        case "percent":
            // Label does not match bar percentage because of possible inversion.
            const labelPercentage = Math.round((Math.clamped(labelValue, 0, labelMax) / labelMax) * 100);
            drawBarLabel(bar, width, height, `${data.label ? data.label + "  " : ""}${labelPercentage}%`);
            break;
        default:
            console.error(`barbrawl | Unknown label style ${game.settings.get("barbrawl", "textStyle")}.`);
    }

    // Update visibility.
    bar.visible = token._canViewMode(data.visibility);

    // Rotate left & right bars.
    if (data.position.startsWith("left")) bar.angle = -90;
    else if (data.position.startsWith("right")) bar.angle = 90;

    return height;
}

/**
 * Draws a bar without borders.
 * @param {PIXI.Graphics} bar The graphics object to draw onto.
 * @param {number} width The target width of the bar.
 * @param {number} height The target height of the bar.
 * @param {number} percentage How far the bar should be filled.
 * @param {string} color The color to fill the bar with.
 * @param {number} segments The amount of segments to draw.
 */
function drawMinimalBar(bar, width, height, percentage, color, segments) {
    if (width <= 0) return;
    bar.clear()
        .beginFill(0x000000, 0.2)
        .drawRect(0, 0, width, height);

    if (percentage <= 0.01) return;
    bar.beginFill(color, 0.8);
    const segmentWidth = percentage * width / segments;
    bar.drawRect(0, 0, segmentWidth, height);
    for (let i = 1; i < segments; i++) {
        bar.drawRect(segmentWidth * i + 1, 0, segmentWidth - 1, height);
    }
}

/**
 * Draws a bar with rounded borders.
 * @param {PIXI.Graphics} bar The graphics object to draw onto.
 * @param {number} width The target width of the bar.
 * @param {number} height The target height of the bar.
 * @param {number} percentage How far the bar should be filled.
 * @param {string} color The color to fill the bar with.
 * @param {number} segments The amount of segments to draw.
 * @param {number} borderWidth The stroke width of the borders.
 * @param {number} borderRadius The radius of the borders.
 */
function drawRoundedBar(bar, width, height, percentage, color, segments, borderWidth, borderRadius) {
    if (width <= 0) return;
    bar.clear()
        .beginFill(0x000000, 0.5)
        .lineStyle(borderWidth, 0x000000, 0.9)
        .drawRoundedRect(0, 0, width, height, borderRadius);

    if (percentage <= 0.01) return;
    bar.beginFill(color, 0.8);
    const segmentWidth = percentage * width / segments;
    for (let i = 0; i < segments; i++) {
        bar.drawRoundedRect(segmentWidth * i, 0, segmentWidth, height, borderRadius - 1);
    }
}

/**
 * Adds a PIXI.Text object on top of the given graphics object.
 * @param {PIXI.Graphics} bar The PIXI object to add the text to.
 * @param {number} width The width of the bar.
 * @param {number} height The height of the bar.
 * @param {string} text The text to display.
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
 * @param {string} minColor The lowest color as RGB hex string.
 * @param {string} maxColor The highest color as RGB hex string.
 * @param {number} percentage The interpolation interval.
 * @returns {string} The interpolated color as RBG hex string.
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
 * @param {number} r The red value of the color as float (0 to 1).
 * @param {number} g The green value of the color as float (0 to 1).
 * @param {number} b The blue value of the color as float (0 to 1).
 * @returns {number[]} The HSV color with hue in degrese (0 to 360), saturation and value as float (0 to 1).
 */
function rgb2hsv(r, g, b) {
    let v = Math.max(r, g, b), c = v - Math.min(r, g, b);
    let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c));
    return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

/**
 * Converts a color from HSV to RGB space.
 * Source: https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately/54024653#54024653
 * @param {number} h The hue of the color in degrees (0 to 360).
 * @param {number} s The saturation of the color as float (0 to 1).
 * @param {number} v The value of the color as float (0 to 1).
 * @returns {number[]} The RGB color with each component as float (0 to 1).
 */
function hsv2rgb(h, s, v) {
    let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)];
}

/**
 * Calculates the width of the bar with the given position relative to the
 *  token's dimensions, respecting already reserved space.
 * @param {Object} barData The data of the bar.
 * @param {Token} token The token to read dimensions from.
 * @param {Object} reservedSpace The amount of already used space per position.
 * @returns {number} The target width of the bar.
 */
function calculateWidth(barData, token, reservedSpace) {
    const indent = ((barData.indentLeft ?? 0) + (barData.indentRight ?? 0)) / 100;
    switch (barData.position) {
        case "top-inner":
        case "bottom-inner":
            return token.w - reservedSpace["left-inner"] - reservedSpace["right-inner"] - indent * token.w;
        case "top-outer":
        case "bottom-outer":
            return token.w - indent * token.w;
        case "left-inner":
        case "right-inner":
            return token.h - reservedSpace["top-inner"] - reservedSpace["bottom-inner"] - indent * token.h;
        case "left-outer":
        case "right-outer":
            return token.h - indent * token.h;
    }
}

/**
 * Calculates the vertical coordinate of the bar with the given position
 *  relative to the token's dimension, respecting already reserved space.
 * @param {Object} barData The data of the bar.
 * @param {number} barHeight The height of the rendered bar.
 * @param {number} leftIndent The amount of bar indentation to apply.
 * @param {Token} token The token to read dimensions from.
 * @param {Object} reservedSpace The amount of already used space per position.
 * @returns {number[]} The target X- and Y-coordinate of the bar.
 */
function calculatePosition(barData, barHeight, token, reservedSpace) {
    const leftIndent = (barData.indentLeft ?? 0) / 100;
    switch (barData.position) {
        case "top-inner": return [reservedSpace["left-inner"] + leftIndent * token.w, reservedSpace["top-inner"]];
        case "top-outer": return [leftIndent * token.w, (reservedSpace["top-outer"] + barHeight) * -1];
        case "bottom-inner": return [reservedSpace["left-inner"] + leftIndent * token.w, token.h - reservedSpace["bottom-inner"] - barHeight];
        case "bottom-outer": return [leftIndent * token.w, token.h + reservedSpace["bottom-outer"]];
        case "left-inner": return [reservedSpace["left-inner"], token.h - reservedSpace["bottom-inner"] - leftIndent * token.h];
        case "left-outer": return [(reservedSpace["left-outer"] + barHeight) * -1, token.h - leftIndent * token.h];
        case "right-inner": return [token.w - reservedSpace["right-inner"], reservedSpace["top-inner"] + leftIndent * token.h];
        case "right-outer": return [reservedSpace["right-outer"] + barHeight + token.w, leftIndent * token.h];
    }
}
