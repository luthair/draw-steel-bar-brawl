/**
 * Extends the original Token.drawBars() with custom bar rendering. 
 *  The original function is not called.
 */
export const extendBarRenderer = function() {  
    Token.prototype.drawBars = drawBrawlBars;
}

/**
 * Modifies the given HTML to replace the resource bar configuration with our
 *  own template.
 * @param {jQuery} html The jQuery element of the token configuration.
 * @param {Object} data The data of the token configuration.
 */
export const extendTokenConfig = async function(html, data) {
	let barConfiguration = await renderTemplate("modules/barbrawl/templates/token-resources.html", data);
	html.find("div[data-tab='resources']").html(barConfiguration);
}

/**
 * Updates the existing resource bars without creating new ones. The bars are
 *  searched by their id (set during creation).
 * @param {Token} token The token to update the bars for.
 * @param {Object[]} newBars The bar data to be merged into the token data.
 */
export const redrawBars = function(token, newBars) {
    let barIds = Object.keys(newBars);
    if (Object.keys(getProperty(token.data, "flags.barbrawl.resourceBars")).length === barIds.length) {
        token.drawBars();
        return;
    }

    for (let barId of barIds) {
        if (barId.startsWith("-=")) {
            token.bars.removeChildAt(token.bars.children.findIndex(bar => barId.endsWith(bar.name)));
        } else {
            // TODO recreate bar
        }
    }
}

/**
 * Creates rendering objects for each of the token's resource bars.
 */
function drawBrawlBars() {
    if (!this.actor) return;

    let bars = getProperty(this.data, "flags.barbrawl.resourceBars");
    if (!bars) return;
    
    this.bars.removeChildren();

    let positionCounts = [0, 0, 0, 0];
    let visibleBarIds = Object.keys(bars).filter(barId => this._canViewMode(bars[barId].visibility));
    for (let barId of visibleBarIds) {
        if (!bars.hasOwnProperty(barId)) return;

        let barData = bars[barId];
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
}

/**
 * Creates a rendering object for a single resource bar.
 * @param {Token} token The token on which to create the bar.
 * @param {Object} data The object containing the bar's data.
 * @param {Number} index The amount of bars previously rendered at the same position.
 */
function createResourceBar(token, data, index) {
    // Fetch the resource
    let resource = data.attribute === "custom" ? {
        type: "bar",
        attribute: "custom",
        value: parseInt(data.value || 0),
        max: parseInt(data.max || 0)
      }
      : token.getBarAttribute(null, { alternative: data.attribute });

    // Create the rendering object
    let bar = new PIXI.Graphics();
    bar.name = data.id;
    if (!resource || resource.type !== "bar") return bar.visible = false;

    // Calculate dimensions
    let percentage = Math.clamped(data.value, 0, data.max) / data.max;
    let height = Math.max((canvas.dimensions.size / 12), 8);
    if ( token.data.height >= 2 ) height *= 1.6;  // Enlarge the bar for large tokens

    // Draw the bar
    let color = interpolateColor(data.mincolor, data.maxcolor, percentage);
    bar.clear()
       .beginFill(0x000000, 0.5)
       .lineStyle(2, 0x000000, 0.9)
       .drawRoundedRect(0, 0, token.w, height, 3)
       .beginFill(color, 0.8)
       .lineStyle(1, 0x000000, 0.8)
       .drawRoundedRect(1, 1, percentage * (token.w - 2), height - 2, 2);
    bar.position.set(0, calculatePosition(data.position, height, token.h, index));
    return bar;
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
function rgb2hsv(r,g,b) {
    let v=Math.max(r,g,b), c=v-Math.min(r,g,b);
    let h= c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c));
    return [60*(h<0?h+6:h), v&&c/v, v];
}

/**
 * Converts a color from HSV to RGB space.
 * Source: https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately/54024653#54024653
 * @param {Number} h The hue of the color in degrees (0 to 360).
 * @param {Number} s The saturation of the color as float (0 to 1).
 * @param {Number} v The value of the color as float (0 to 1).
 * @returns {Number[]} The RGB color with each component as float (0 to 1).
 */
function hsv2rgb(h,s,v) 
{                              
  let f= (n,k=(n+h/60)%6) => v - v*s*Math.max( Math.min(k,4-k,1), 0);     
  return [f(5),f(3),f(1)];       
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
