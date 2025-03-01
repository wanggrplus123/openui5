sap.ui.define(['sap/ui/webc/common/thirdparty/base/renderer/LitRenderer'], function (litRender) { 'use strict';

	const block0 = (context, tags, suffix) => litRender.html`<${litRender.scopeTag("ui5-li-custom", tags, suffix)} id="${litRender.ifDefined(context._id)}" data-ui5-stable="${litRender.ifDefined(context.stableDomRef)}" role="separator" class="${litRender.classMap(context.classes)}" disabled></${litRender.scopeTag("ui5-li-custom", tags, suffix)}>`;

	return block0;

});
