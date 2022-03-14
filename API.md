## Constants

<dl>
<dt><a href="#BAR_VISIBILITY">BAR_VISIBILITY</a></dt>
<dd><p>Valid bar visibility settings. See Foundry&#39;s CONST.TOKEN_DISPLAY_MODES for details.</p>
</dd>
<dt><a href="#getActualBarValue">getActualBarValue</a> ⇒ <code>Object</code></dt>
<dd><p>Calculates the real value of the displayed bar.</p>
</dd>
<dt><a href="#isBarVisible">isBarVisible</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if the given bar should be visible on the given token.</p>
</dd>
</dl>

<a name="BAR_VISIBILITY"></a>

## BAR\_VISIBILITY
Valid bar visibility settings. See Foundry's CONST.TOKEN_DISPLAY_MODES for details.

**Kind**: global constant  
<a name="getActualBarValue"></a>

## getActualBarValue ⇒ <code>Object</code>
Calculates the real value of the displayed bar.

**Kind**: global constant  
**Returns**: <code>Object</code> - An object containing the current and maximum value of the bar.  

| Param | Type | Description |
| --- | --- | --- |
| tokenDoc | <code>TokenDocument</code> | The token document that the bar belongs to. |
| bar | <code>Object</code> | The data of the bar. |
| [resolveValue] | <code>boolean</code> | Indicates whether the value of the bar should be resolved using the bar's  attribute. Defaults to true. |

<a name="isBarVisible"></a>

## isBarVisible ⇒ <code>boolean</code>
Checks if the given bar should be visible on the given token.

**Kind**: global constant  
**Returns**: <code>boolean</code> - True if the bar is currently visible, false otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>Token</code> | The token of the bar. |
| bar | <code>Object</code> | The data of the bar. |
| [ignoreTransient] | <code>boolean</code> | Treat transient states (e.g. hovered or controlled) as permanent. Defaults to false. |

