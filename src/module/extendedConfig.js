import { onChangeBarAttribute } from "./rendering.js";

export default class BarConfigExtended extends FormApplication {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "modules/barbrawl/templates/bar-config-extended.hbs",
            width: 480
        });
    }

    /** @override */
    get id() {
        return `brawlbar-${this.object.id}`;
    }

    /** @override */
    get title() {
        return `${game.i18n.localize("barbrawl.config.advanced")}: ${this.object.id}`;
    }

    /** @override */
    async _updateObject(_event, formData) {
        await this.options.parent.update(formData);
        return Object.values(ui.windows)
            .find(conf => conf instanceof TokenConfig && conf.object === this.options.parent)
            ?.render();
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".brawlbar-attribute").change(onChangeBarAttribute.bind(this.options.parent));
    }
}