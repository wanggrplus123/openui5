sap.ui.define(['sap/ui/webc/common/thirdparty/base/renderer/LitRenderer'], function (litRender) { 'use strict';

	const block0 = (context, tags, suffix) => litRender.html`${ context.displayValueStateMessagePopover ? block1(context, tags, suffix) : undefined }`;
	const block1 = (context, tags, suffix) => litRender.html`<${litRender.scopeTag("ui5-popover", tags, suffix)} skip-registry-update prevent-focus-restore hide-arrow _disable-initial-focus class="ui5-valuestatemessage-popover" style="${litRender.styleMap(context.styles.valueStateMsgPopover)}" placement-type="Bottom" horizontal-align="${litRender.ifDefined(context._valueStatePopoverHorizontalAlign)}"><div slot="header" class="ui5-valuestatemessage-root ${litRender.classMap(context.classes.valueStateMsg)}"><${litRender.scopeTag("ui5-icon", tags, suffix)} class="ui5-input-value-state-message-icon" name="${litRender.ifDefined(context._valueStateMessageIcon)}"></${litRender.scopeTag("ui5-icon", tags, suffix)}>${ context.hasCustomValueState ? block2(context) : block4(context) }</div></${litRender.scopeTag("ui5-popover", tags, suffix)}>`;
	const block2 = (context, tags, suffix) => litRender.html`${ litRender.repeat(context.valueStateMessageText, (item, index) => item._id || index, (item, index) => block3(item)) }`;
	const block3 = (item, index, context, tags, suffix) => litRender.html`${litRender.ifDefined(item)}`;
	const block4 = (context, tags, suffix) => litRender.html`${litRender.ifDefined(context.valueStateText)}`;

	return block0;

});
