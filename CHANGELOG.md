Fork notes
- Fork maintained by Luthair.
- Original Bar Brawl authorship and prior contributions by Adrian Haberecht remain credited.
- Intended fork direction: revise segmentation calculations to better match Draw Steel stamina and recovery behavior.

1.9.0
- Modernized resource configuration UI.
- Improved token preview of bar changes.

1.8.13
- Added an option to hide a bar's background texture (thanks *SagaTympana*).
- Improved migration of global bar visibility overrides.
- Fixed token configuration with newer FoundryVTT versions when less than 2 bars are present.
- Fixed color pickers.
- Fixed move and delete buttons.

1.8.12
- Fixed token HUD inputs not working with more than two bars.

1.8.11
- Fixed flag reset for other systems and modules when Bar Brawl is enabled.
- Fixed an issue with DnD5e resource localization.

1.8.10
- Added support for FoundryVTT v13.
- Added option to disable bitmap caching.
- Moved global token resource defaults to module settings. This will reset defaults that aren't actor type specific.
- Fixed configuration display when Simple d20 stats is installed.

1.8.9
- Added Polish translation (thanks *Lioheart*).
- Added built-in support for caching bars (thanks *Codas*).
- Fixed an issue that prevented broken bars from being removed.

1.8.8
- Added option to hide the HUD for a resource.
- Fixed HUD inputs not working.
- Improved display of large values when the compact HUD is enabled.

1.8.7
- Fixed unchanged bars occasionally becoming visible for everyone.
- Fixed default token configuration not rendering.
- Fixed submitting PF2e token configuration (and probably other systems).
- Fixed filepicker whitespace issues.

1.8.6
- Replace deprecated FoundryVTT APIs.
- Fixed token configuration layout when other modules added inputs.
- Fixed health bar layout for DnD5e party tokens.

1.8.5
- Added Brazilian Portuguese translation (thanks *Kharmans*).
- Fixed missing save button in prototype tokens.
- Fixed inconsistent bar visibility for new actors.

1.8.4
- Reworked resource saving and loading from the token configuration.
- Removed resource overrides for new tokens. Default resources will now only be applied to new actors.
- Improved compatibility for newer DnD5e versions.

1.8.3
- Fixed a deprecation warning for the hover only visibility.
- Fixed hidden full and empty bars randomly reappearing.
- Fixed funky approximations for out of bounds values.

1.8.2
- Added bar height multiplier to increase readability (thanks *GSBicalho*).
- Fixed defaults not applying when the world's default token was modified.
- Fixed bar changes not applying immediately.

1.8.1
- Fixed rendering error in FoundryVTT v11.

1.8.0
- Added user option to enlarge token HUD inputs (effectively reverting the size change from core).
- Added world option to hide all bars of non-owned hostile tokens.
- Added configuration to flip a bar (thanks @Kindled Embers).
- Unlocked an entirely new dimension (added support for Levels3D scenes).
- Fixed limit options always displaying as off.
- Fixed hover or selected visibility.

1.7.7
- Fixed file picker buttons not working.
- Fixed duplicate effects while configuring the token.

1.7.6
- Fixed bars disappearing when changing other token settings.
- Fixed bars reverting to default settings after creation.

1.7.5
- Moved advanced configuration into expandable section to improve v10 compatibility.
- Fixed rendering issue when all bars were removed.
- Fixed default settings overriding the prototype token.

1.7.4
- Partially fixed broken bars when using the advanced configuration.
- Fixed undeletable bars.

1.7.3
- Updated for FoundryVTT 10.284 and above.

1.7.2
- Fixed hidden bars reappearing when hovering the token.
- Fixed some issues when configuring the default token.

1.7.1
- Fixed an infinite loop for derived attributes defined by the system.
- Fixed some issues with the advanced configuration in prototype tokens.

1.7.0
- Added configuration for hiding full or empty bars.
- Added configuration for hiding bars in or out of combat.
- Fixed FoundryVTT resource conversion for existing tokens.
- Fixed resources sometimes being hidden from the token HUD.

1.6.0
- Added separate visibility setting for game masters. This defaults to inherit from the owner visibility.
- Implemented public API to allow internal logic access from other modules.
- Bar IDs are now displayed in the configuration menu on hover. This is helpful for determining the primary bars (`bar1` and `bar2`) for access from other modules.

1.5.0
- Added opacity configuration.
- Added option to share the same height with multiple bars.
- Added owner visibility option for controlled *or* hovered.
- Fixed several issues with the default token configuration.
- Fixed loaded defaults not displaying correctly.
- Fixed owner display for inverted bars with approximation.
- Fixed non-persistent basic settings in advanced configuration.
- Fixed a compatibility issue with game systems that override the token document.
- Added Korean translation (thanks *flattenstream*).

1.4.1
- Fixed a compatibility issue with libWrapper.
- Fixed resource creation when there are less than two.

1.4.0
- Updated for FoundryVTT 0.9.
- Added separate visibility configuration for owner and everyone else.
- Added option to store default settings per actor type.
- Fixed defaults not applying to prototype tokens.
- It is now possible to load empty defaults using the button. Empty defaults will not be applied when creating actors and tokens.

1.3.1
- Fixed a bug that caused bars to appear twice.
- Fixed advanced bar configuration for prototype tokens.

1.3.0
- Fixed a compatibility issue with Pathfinder 1.
- Moved default configuration to world scope. **This version will reset your default bar settings.**
- Added button to restore the default bar configuration for a token.
- Added configurable prefix text for bar labels.
- Added approximate value segments.
- Reintroduced old (FoundryVTT 0.7.9 and below) bar style as "legacy".
- Added side bar positioning.
- Added bar indentation.
- Bars can now be explicitly removed or reordered in the token configuration.
- Added bar foreground & background images.
- Added Japanese translation (thanks *tonishi* and *BrotherSharper*).

1.2.5
- Fixed some labels being drawn twice.
- Fixed updates not refreshing custom value bars.
- Fixed delta changes to custom values (e.g. -10).

1.2.4
- Fixed bars disappearing on hover until the token is updated.
- Fixed redraw not working for some bars.

1.2.3
- Fixed configuration not being displayed for prototype tokens.
- Changed default bar style to match FoundryVTT's styling again.

1.2.2
- Updated for FoundryVTT 0.8. This release will not work with older versions.
- Improved compatibility with system resource handling.
- Added numeric display on top of Arbron's Improved HP Bar.

1.2.1
- Added compatibility with Arbron's Improved HP Bar.
- Changed default value of the "Ignore limits" option for non-custom bars.
- Fixed temporary values being ignored for delta updates (e.g. HP -5).
- Fixed default configuration overriding prototype token configuration.
- Fixed some weirdness with the token configuration window height.

1.2.0
- Added functionality to turn single values into proper bars by setting a maximum value.
- Added default token resource configuration. Simply hit the button in the token config to store it. To reset the defaults, go to the module settings.
- Added per-resource option for overriding the text style.
- Added per-resource option for ignoring upper and lower value limits.
- Added per-resource option for inverting the bar (lower value equals higher percentage).
- Added libWrapper support for managing module conflicts.
- Fixed prototype tokens not updating properly.
- Fixed incompatibility with Token Tooltip Alt.

1.1.0
- Fixed hover visibility settings not working as intended.
- Added user-settings for how bars are displayed (separate for style and label).

1.0.1
- Existing bars (and overrides of the token configuration) should now be imported.
- Fixed missing input field for resources without a maximum value.

1.0.0
- Core functionality.
