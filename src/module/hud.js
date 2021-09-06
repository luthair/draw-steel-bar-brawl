import { getVisibleBars } from "./api.js";

/**
 * Modifies the given HTML to render additional resource input fields.
 * @param {TokenHUD} tokenHud The HUD object.
 * @param {jQuery} html The jQuery element of the token HUD.
 * @param {Object} data The data of the token HUD.
 */
export const extendTokenHud = async function (tokenHud, html, data) {
    const visibleBars = getVisibleBars(tokenHud.object.document, false);

    // Group bars by side.
    data.bars = {
        top: [],
        bottom: [],
        left: [],
        right: []
    }
    visibleBars.forEach(bar => data.bars[bar.position.split('-')[0]].push(bar));

    const resourceInputs = await renderTemplate("modules/barbrawl/templates/resource-hud.hbs", data);
    const middleColumn = html.find(".col.middle");
    middleColumn.html(resourceInputs);

    // TODO display left and right inputs in separate column

    middleColumn.find(".attribute input")
        .click(tokenHud._onAttributeClick)
        .keydown(tokenHud._onAttributeKeydown.bind(tokenHud))
        .focusout(tokenHud._onAttributeUpdate.bind(tokenHud));
}
