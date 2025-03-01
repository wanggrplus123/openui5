sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/webc/main/Toast"
], function(Controller, JSONModel, Toast) {
	"use strict";

	return Controller.extend("sap.ui.webc.main.sample.ResponsivePopover.C", {

		onInit: function() {
			var oModel = new JSONModel(sap.ui.require.toUrl("sap/ui/demo/mock/products.json"));
			this.getView().setModel(oModel);
		},
		handleAfterClose: function(oEvent) {
			var demoToast = this.getView().byId("demoToast");
			demoToast.setText("Event afterClose fired.");
			demoToast.show();
		},
		handleAfterOpen: function(oEvent) {
			var demoToast = this.getView().byId("demoToast");
			demoToast.setText("Event afterOpen fired.");
			demoToast.show();
		},
		handleBeforeClose: function(oEvent) {
			var demoToast = this.getView().byId("demoToast");
			demoToast.setText("Event beforeClose fired.");
			demoToast.show();
		},
		handleBeforeOpen: function(oEvent) {
			var demoToast = this.getView().byId("demoToast");
			demoToast.setText("Event beforeOpen fired.");
			demoToast.show();
		}

	});
});