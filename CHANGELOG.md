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