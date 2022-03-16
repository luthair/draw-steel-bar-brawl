## Constants

<dl>
<dt><a href="#getBars">getBars</a> ⇒ <code>Array.&lt;Object&gt;</code></dt>
<dd><p>Retreives all resource bars of the given token document, sorted by their
 configured order.</p>
</dd>
<dt><a href="#getBar">getBar</a> ⇒ <code>Object</code></dt>
<dd><p>Retreives the data of a single resource bar of the given token document.</p>
</dd>
<dt><a href="#getActualBarValue">getActualBarValue</a> ⇒ <code>Object</code></dt>
<dd><p>Calculates the real value of the displayed bar.</p>
</dd>
<dt><a href="#isBarVisible">isBarVisible</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if the given bar should be visible on the given token.</p>
</dd>
</dl>

<a name="getBars"></a>

## getBars ⇒ <code>Array.&lt;Object&gt;</code>
Retreives all resource bars of the given token document, sorted by their configured order.

**Kind**: global constant  
**Returns**: <code>Array.&lt;Object&gt;</code> - An array of bar data.  

| Param | Type | Description |
| --- | --- | --- |
| tokenDoc | <code>TokenDocument</code> | The token document to fetch the bars from. |

<a name="getBar"></a>

## getBar ⇒ <code>Object</code>
Retreives the data of a single resource bar of the given token document.

**Kind**: global constant  
**Returns**: <code>Object</code> - A bar data object.  

| Param | Type | Description |
| --- | --- | --- |
| tokenDoc | <code>TokenDocument</code> | The token document to fetch the bar from. |
| barId | <code>string</code> | The ID of the bar to fetch. |

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

