# FoundryVTT Bar Brawl

This is the repository of the resource bar addon for FoundryVTT.

## Usage

**Bar Brawl** allows an arbitrary amount of customizable resource bars for tokens.

![Bar Brawl](sample.png "Bar Brawl")

The module replaces the menu found in *Token Configuration* > *Resources*. Here, you can add a new bar by clicking *Add resource*.

For each bar, there are several options:
- The **Attribute** controls the source of the displayed values. *None* will remove the bar, *Custom* allows setting your own numbers and every other entry represents an attribute of the actor.
- To show bars to other players (or hide them completely), change the **Visibility** setting.
- The current and maximum **Value** fields show the used numbers and can be changed for custom bars.
- Minimum and maximum **Color** values are interpolated between the two (depending on how full the bar is). The maximum color is also used for the border of the token's HUD inputs.
- The **Position** can be used to align bars at the top or bottom of the token (facing inwards or outwards).
