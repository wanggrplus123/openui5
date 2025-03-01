/*!
 * ${copyright}
 */

sap.ui.define([
        "sap/ui/core/Core",
        "sap/ui/mdc/Control",
        "./chart/ChartSettings",
        "sap/ui/mdc/util/loadModules",
        "./ChartRenderer",
        "sap/ui/mdc/library",
        "sap/m/Text",
        "sap/m/VBox",
        "sap/base/Log",
        "./chart/ChartToolbar",
        "./chart/PropertyHelper",
        "sap/ui/mdc/mixin/FilterIntegrationMixin",
        "sap/ui/model/base/ManagedObjectModel",
        "sap/ui/mdc/p13n/subcontroller/ChartItemController",
        "sap/ui/mdc/p13n/subcontroller/FilterController",
        "sap/ui/mdc/p13n/subcontroller/SortController",
        "sap/ui/base/ManagedObjectObserver",
        "sap/ui/mdc/chart/DrillBreadcrumbs",
        "sap/ui/mdc/actiontoolbar/ActionToolbarAction",
        "sap/ui/thirdparty/jquery"
    ],
    function (
        Core,
        Control,
        ChartSettings,
        loadModules,
        ChartRenderer,
        MDCLib,
        Text,
        VBox,
        Log,
        ChartToolbar,
        PropertyHelper,
        FilterIntegrationMixin,
        ManagedObjectModel,
        ChartItemController,
        FilterController,
        SortController,
        ManagedObjectObserver,
        Breadcrumbs,
        ActionToolbarAction,
        jQuery
    ) {
        "use strict";

        var DrillStackHandler;

        /**
         * Constructor for a new Chart.
         *
         * @param {string} [sId] id for the new control, generated automatically if no id is given
         * @param {object} [mSettings] initial settings for the new control
         * @class The Chart control creates a chart based on metadata and the configuration specified.
         * @extends sap.ui.mdc.Control
         * @author SAP SE
         * @version ${version}
         * @constructor
         * @experimental As of version ...
         * @private
         * @ui5-restricted sap.fe
         * @MDC_PUBLIC_CANDIDATE
         * @since 1.88
         * @alias sap.ui.mdc.Chart
         * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
         */
        var Chart = Control.extend("sap.ui.mdc.Chart", /** @lends sap.ui.mdc.Chart.prototype */ {
            metadata: {
                library: "sap.ui.mdc",
                designtime: "sap/ui/mdc/designtime/chart/Chart.designtime",
                interfaces: [
                    "sap.ui.mdc.IFilterSource",
                    "sap.ui.mdc.IxState"
                ],
                defaultAggregation: "items",
                properties: {
                    /**
					 * Defines the width of the chart.
					 */
					width: {
						type: "sap.ui.core.CSSSize",
						group: "Dimension",
						defaultValue: "100%",
						invalidate: true
					},
					/**
					 * Defines the height of the chart.
					 */
					height: {
						type: "sap.ui.core.CSSSize",
						group: "Dimension",
						defaultValue: "100%",
						invalidate: true
					},
                    /**
                     * Defines the module path of the metadata delegate.
                     */
                    delegate: {
                        type: "object",
                        group: "Data",
                        defaultValue: {
                            name: "sap/ui/mdc/ChartDelegate"
                        }
                    },
                    /**
                     * Specifies header text that is shown in chart
                     */
                    header: {
                        type: "string",
                        group: "Misc",
                        defaultValue: null
                    },
                    /**
                     * Defines the no data text shown in the chart.
                     * @since 1.88
                     */
                    noDataText: {
                        type: "string",
                        defaultValue: "No data"
                    },
                    /**
                     * Specifies the personalization options available for the chart.<br>
                     * <b>Note:</b> The order of the provided options does not influence the arrangement of the icons on the UI.
                     *
                     * @since 1.88
                     */
                    p13nMode: {
                        type: "sap.ui.mdc.ChartP13nMode[]",
                        defaultValue: []
                    },

                    /**
                     * Enables the legend of the chart.
                     *
                     * @since 1.88
                     */
                    legendVisible: {
                        type: "boolean",
                        group: "Misc",
                        defaultValue: true
                    },
                    /**
                     * Specifies which actions should not be available in the chart's toolbar.
                     *
                     * @since 1.88
                     */
                    ignoreToolbarActions: {
                        type: "sap.ui.mdc.ChartToolbarActionType[]",
                        defaultValue: []
                    },
                    //TODO: Do we really need this? Should be avoided.
                    /**
                     * The minimal width
                     */
                    minWidth: {
                        type: "sap.ui.core.CSSSize",
                        group: "Dimension",
                        defaultValue: "240px",
                        invalidate: true
                    },
                    //TODO: Do we really need this? Should be avoided.
                    /**
                     * The minimal height
                     */
                    minHeight: {
                        type: "sap.ui.core.CSSSize",
                        group: "Dimension",
                        defaultValue: "400px",
                        invalidate: true
                    },
                    /**
                     * Defines the sort conditions.
                     *
                     * <b>Note:</b> This property is exclusively used for handling flexibility changes. Do not use it for anything else.
                     *
                     * @since 1.88
                     */
                    sortConditions: {
                        type: "object"
                    },
                    /**
                     * Defines the filter conditions.
                     *
                     * <b>Note:</b> This property is exclusively used for handling flexibility changes. Do not use it for anything else.
                     *
                     * @since 1.99
                     */
                     filterConditions: {
                        type: "object",
                        defaultValue: {}
                    },
                    /**
                     * Controls the visibility of the chart tooltip. If set to <code>true</code>, an instance of {@link sap.viz.ui5.controls.VizTooltip} is created and shown when hovering over a data point.
                     *
                     * @since 1.88
                     */
                    showChartTooltip: {
                        type: "boolean",
                        group: "Misc",
                        defaultValue: true
                    },
                    /**
                     * If set to <code>true</code>, the chart is automatically bound after initialization.
                     * If set to <code>false</code>, the chart is bound after the first call to <code>rebind</code>.
                     */
                    autoBindOnInit: {
                        type: "boolean",
                        group: "Misc",
                        defaultValue: true
                    },

                    /**
                     * Specifies the type of chart to be created by the <code>Chart</code> control.
                     */
                    chartType: {
                        type: "string",
                        group: "Misc",
                        defaultValue: "column"
                    },
                    showSelectionDetails: {
                        type: "boolean",
                        group: "Misc",
                        defaultValue: true
                    },
                    /**
                     * Specifies the filter metadata.<br>
                     * <b>Note</b>: This property must not be bound.<br>
                     * <b>Note</b>: This property is used exclusively for SAPUI5 flexibility/ Fiori Elements. Do not use it otherwise.
                     *
                     * @since 1.99
                     */
                    propertyInfo: {
                        type: "object",
                        defaultValue: []
                    }
                },
                aggregations: {
                    items: {
                        type: "sap.ui.mdc.chart.Item",
                        multiple: true
                    },
                    actions: {
                        type: "sap.ui.core.Control",
                        multiple: true,
                        forwarding: {
                            getter: "_getToolbar",
                            aggregation: "actions"
                        }
                    },
                    _toolbar: {
                        type: "sap.ui.mdc.chart.ChartToolbar",
                        multiple: false,
                        visibility: "hidden"
                    },
                    _breadcrumbs: {
                        type: "sap.m.Breadcrumbs",
                        multiple: false,
                        visibility: "hidden"
                    },
                    _innerChart: {
                        type: "sap.ui.core.Control",
                        multiple: false,
                        visibility: "hidden"
                    },
                    selectionDetailsActions: {
                        type: "sap.ui.mdc.chart.SelectionDetailsActions",
                        multiple: false
                    },
                    /**
                     * <code>VariantManagement<code> control for the chart.
                     */
                    variant: {
                        type: "sap.ui.fl.variants.VariantManagement",
                        multiple: false
                    }
                },
                associations: {
                    /**
                     * Control or object which enables the chart to do filtering, such as {@link sap.ui.mdc.FilterBar}.
                     * Also see {@link sap.ui.mdc.IFilter}.
                     *
                     * @since 1.88
                     */
                    filter: {
                        type: "sap.ui.mdc.IFilter",
                        multiple: false
                    }
                },
                events: {
                    /**
                     * This event is fired when a SelectionDetailsAction is pressed.
                     */
                    selectionDetailsActionPressed: {
                        parameters: {

                            /**
                             * The action that has to be processed once the action has been pressed
                             */
                            action: {
                                type: "sap.ui.core.Item"
                            },

                            /**
                             * If the action is pressed on one of the {@link sap.m.SelectionDetailsItem items}, the parameter contains the
                             * {@link sap.ui.model.Context context} of the pressed {@link sap.m.SelectionDetailsItem item}. If a custom action or action
                             * group of the SelectionDetails popover is pressed, this parameter contains all {@link sap.ui.model.Context contexts} of the
                             * {@link sap.m.SelectionDetailsItem items}.
                             */
                            itemContexts: {
                                type: "sap.ui.model.Context"
                            },

                            /**
                             * The action level of action buttons. The available levels are Item, List and Group
                             */
                            level: {
                                type: "sap.m.SelectionDetailsActionLevel"
                            }
                        }
                    },
                    /**
                     * This event is fired when a data load on the inner chart completes
                     */
                    innerChartLoadedData: {
                        parameters: {
                            /**
                             * Reference to the inner chart
                             */
                            innerChart: {
                                type: "sap.ui.core.Control"
                            }
                        }
                    }
                }
            },

            renderer: ChartRenderer
        });

        FilterIntegrationMixin.call(Chart.prototype);

        /**
         * Initialises the MDC Chart
         *
         * @experimental
         * @private
         * @ui5-restricted sap.ui.mdc
         */
        Chart.prototype.init = function () {
            this._oManagedObjectModel = new ManagedObjectModel(this);
            this.setModel(this._oManagedObjectModel, "$mdcChart");
            this._bNewP13n = true;//TODO: remove with migration
            Control.prototype.init.apply(this, arguments);

            this._setupPropertyInfoStore("propertyInfo");
            this._setPropertyHelperClass(PropertyHelper);
        };

        Chart.prototype.setP13nMode = function(aMode) {
            var aSortedKeys = null;
            if (aMode && aMode.length >= 1){
                aSortedKeys = [];
                var mKeys = aMode.reduce(function(mMap, sKey, iIndex){
                    mMap[sKey] = true;
                    return mMap;
                }, {});

                //as the p13nMode has no strict order we need to ensure the order of tabs here
                if (mKeys.Item) {
                    aSortedKeys.push("Item");
                }
                if (mKeys.Sort) {
                    aSortedKeys.push("Sort");
                }
                if (mKeys.Filter) {
                    aSortedKeys.push("Filter");
                }
                if (mKeys.Type) {
                    this._typeBtnActive = true;
                } else {
                    this._typeBtnActive = false;
                }
            } else {
                aSortedKeys = aMode;
            }

            this.setProperty("p13nMode", aSortedKeys, true);

            this._updateAdaptation(this.getP13nMode());

            return this;
        };

        Chart.prototype._updateAdaptation = function(aMode) {
            var oRegisterConfig = {
                controller: {}
            };

            var mRegistryOptions = {
                Item: ChartItemController,
                Sort: SortController,
                Filter: FilterController
            };

            if (aMode && aMode.length > 0) {
                aMode.forEach(function(sMode){
                    var sKey = sMode;
                    var oController = mRegistryOptions[sMode];
                    if (oController) {
                        oRegisterConfig.controller[sKey] = oController;
                    }
                });

                this.getEngine().registerAdaptation(this, oRegisterConfig);
            }

        };


        Chart.prototype.isFilteringEnabled = function() {
            return this.getP13nMode().indexOf("Filter") > -1;
        };

        Chart.prototype.setFilterConditions = function(mConditions) {
            this.setProperty("filterConditions", mConditions, true);

            var oP13nFilter = this.getInbuiltFilter();
            if (oP13nFilter) {
                oP13nFilter.setFilterConditions(mConditions);
            }

            return this;
        };

        Chart.prototype.getConditions = function() {
            //may only return conditions if the inner FilterBar has already been initialized
            return this.getInbuiltFilter() ? this.getInbuiltFilter().getConditions() : [];
        };

        Chart.prototype._registerInnerFilter = function(oFilter) {
            oFilter.attachSearch(function() {
                this._rebind();
            }, this);
        };

        /**
         * Applies given settings onto the MDC Chart, loads the delegate and initializes the MDC Chart
         *
         * @param {*} mSettings settings to apply
         *
         * @experimental
         * @private
         * @ui5-restricted sap.ui.mdc
         */
        Chart.prototype.applySettings = function (mSettings, oScope) {
            this._setPropertyHelperClass(PropertyHelper);
            Control.prototype.applySettings.apply(this, arguments);

            this.initializedPromise = new Promise(function (resolve, reject) {
                this._fnResolveInitialized = resolve;
                this._fnRejectInitialized = reject;
            }.bind(this));

            this.innerChartBoundPromise = new Promise(function (resolve, reject) {
                this._fnResolveInnerChartBound = resolve;
                this._fnRejectInnerChartBound = reject;
            }.bind(this));

            //load required modules before init of inner controls
            var pLoadDelegate = this._loadDelegate().then(function(oDelegate){
                return oDelegate;
            }).then(function(oDelegate){
                return this.initControlDelegate(oDelegate);
            }.bind(this)).catch(function (error) {
                this._fnRejectInitialized(error);
            }.bind(this));

            var aInitPromises = [
                pLoadDelegate
            ];

            if (this.isFilteringEnabled()) {
                aInitPromises.push(this.retrieveInbuiltFilter());
            }

            //TODO: Refactor this so we use awaitPropertyHelper
            Promise.all(aInitPromises).then(function(){
                this._initInnerControls();
            }.bind(this));

        };

        /**
         * Initializes the inner controls of the MDC Chart (toolbar, inner chart)
         * Inner chart is initialized via the delegate
         */
        Chart.prototype._initInnerControls = function () {

            this.getControlDelegate().initializeInnerChart(this).then(function (oInnerChart) {

                this.setBusyIndicatorDelay(0);

                this.getControlDelegate().createInitialChartContent(this);
                this._renderOverlay(true);

                if (this.getAutoBindOnInit()) {
                    this.setBusy(true);
                    this._createContentfromPropertyInfos(oInnerChart);
                }

                this.setAggregation("_innerChart", oInnerChart);
                this._bInnerChartReady = true;
                this._fnResolveInitialized();
                this.invalidate();

            }.bind(this)).catch(function (error) {
                this._fnRejectInitialized(error);
            }.bind(this));

            //independent from fetchProperties
            this._getToolbar().createToolbarContent(this);
        };

        /**
         * Creates the content for the inner chart from properties.
         * The properties are given via the PropertyHelper which is initialized here.
         * The rest of the creation of the content for the inner chart is done in the delegate.
         * Also creates the breadcrumbs.
         *
         * Is called during init when autoBindOnInit = "true", if "false" then this is called by _rebind()
         */
        Chart.prototype._createContentfromPropertyInfos = function (oInnerChart) {

            //Make sure all MDC Items have the necessary information to create a chart
            this.getControlDelegate().checkAndUpdateMDCItems(this).then(function(){
                //Create content on inner chart instance
                this.getControlDelegate().createInnerChartContent(this, this._innerChartDataLoadComplete.bind(this)).then(function(){
                    this._createBreadcrumbs();
                    //From now on, listen to changes on Items Aggregation and sync them with inner chart
                    this._oObserver = new ManagedObjectObserver(this._propagateItemChangeToInnerChart.bind(this));
                    this._oObserver.observe(this, {
                        aggregations: [
                            "items"
                        ]
                    });

                    //Sync MDC Chart properties with inner chart
                    this._propagatePropertiesToInnerChart();

                    this._fnResolveInnerChartBound();
                }.bind(this));
            }.bind(this));
        };

        Chart.prototype.setHeight = function(iHeight) {
            try {
                this.getControlDelegate().adjustChartHeight(this);
            } catch (oError) {
                //No need to do anything as correct height will be calculated anyways once inner chart is ready
            }

            this.setProperty("height", iHeight);

            return this;
        };

        Chart.prototype._createBreadcrumbs = function () {
            this._oBreadcrumbs = new Breadcrumbs(this.getId() + "--breadcrumbs");
            this._oBreadcrumbs.updateDrillBreadcrumbs(this, this.getControlDelegate().getDrillableItems(this));
            this.setAggregation("_breadcrumbs", this._oBreadcrumbs);

            this._oBreadcrumbs.addEventDelegate({
                onAfterRendering: function() {
                    this.getControlDelegate().adjustChartHeight(this);
                }.bind(this)
            });
        };

        /**
         * Loads the delegate for the MDC Chart
         * @returns {Promise} resolved when delegate is loaded
         */
        Chart.prototype._loadDelegate = function () {

            return new Promise(function (resolve) {
                var aNotLoadedModulePaths = [this.getDelegate().name];

                function onModulesLoadedSuccess(oDelegate) {
                    resolve(oDelegate);
                }

                sap.ui.require(aNotLoadedModulePaths, onModulesLoadedSuccess);
            }.bind(this));

        };
        /**
         * Gets whether filtering is enabled for p13n
         *
         * @experimental
         * @private
         * @ui5-restricted Fiori Elements
         */
        Chart.prototype.isFilteringEnabled = function () {
            return this.getP13nMode().indexOf("Filter") > -1;
        };

        /**
         * Gets the adaption UI for the p13n dialog
         * @returns {Prmoise} promise that resolves with UI
         */
        Chart.prototype.getAdaptationUI = function () {
            return this.getControlDelegate().getAdaptionUI(this);
        };

        /**
         * Propagates a change on the "item" aggregation to the inner chart via the delegate
         * The delegate must then update the inner chart accordingly
         *
         * @param {object} oChange the change object from the ManagedObjectModel observer
         */
        Chart.prototype._propagateItemChangeToInnerChart = function (oChange) {

            if (this._bIsDestroyed){
                return; //Don't propagate changes when CHart is destroyed
            }

            this.setBusy(true);
            switch (oChange.mutation) {

                case "insert":
                    var iIndex;

                    if (oChange.child && oChange.child.getType()) {
                        iIndex = this.getItems().filter(function(oItem){return oItem.getType() === oChange.child.getType();}).indexOf(oChange.child);
                    } else {
                        iIndex = this.getItems().indexOf(oChange.child);
                    }

                    this.getControlDelegate().insertItemToInnerChart(this, oChange.child, iIndex);
                    break;
                case "remove":
                    this.getControlDelegate().removeItemFromInnerChart(this, oChange.child);
                    break;
                default:
                    Log.error("Unknown mutation on MDC Chart Item Aggregation. This will not sync to inner chart!");
                    break;
            }

            //Needed to apply current sorters when sorted measure/dimension was not selected yet
            //However, since this gets called multiple times when the aggregation adds/removes multiple properties, the binding seems to break
            this._rebind();

            //Update the breadcrumbs after an MDC Item change
            this._oBreadcrumbs.updateDrillBreadcrumbs(this, this.getControlDelegate().getDrillableItems(this));
        };

        /**
         * Rebinds the inner chart instance by calling oDelegate.rebindChart
         */
        Chart.prototype._rebind = function () {

            if (!this._bInnerChartReady) {
                //TODO: This can lead to a race conditition when the "Go" button is pressed while the inner chart still intializes
                //TODO: Check whether we really need this since we insantiate the inner chart right away
                //this._initInnerControls();

                //Wait with rebind until inner chart is ready
                this.initialized().then(function () {
                    this._rebind();
                }.bind(this));
                return;
            }

            this.setBusy(true);

            if (!this.getControlDelegate().getInnerChartBound(this)) {
                this._createContentfromPropertyInfos();
                return;
            }

            var oBindingInfo = this.getControlDelegate()._getBindingInfo(this);

            if (oBindingInfo) {
                oBindingInfo.sorter = this._getSorters();
            }

            this.getControlDelegate().updateBindingInfo(this, oBindingInfo); //Applies filters
            this.getControlDelegate().rebind(this, oBindingInfo);
        };

        /**
         * Creates a new instance of ChartToolbar
         *
         * @private
         */
        Chart.prototype._getToolbar = function () {
            if (this.getAggregation("_toolbar")) {
                return this.getAggregation("_toolbar");
            } else {
                var oToolbar = new ChartToolbar(this.getId() + "--toolbar", {
                    design: "Transparent"
                });

                this.setAggregation("_toolbar", oToolbar);
                return oToolbar;
            }
        };

        /**
         * Calls the update function on the toolbar, if toolbar exists
         *
         * @private
         */
        Chart.prototype._updateToolbar = function () {
            if (this.getAggregation("_toolbar")) {
                this.getAggregation("_toolbar").updateToolbar(this);
            } else {
                Log.warning("Trying to uipdate Chart Toolbar, but toolbar is not yet initialized. This will not work!");
            }
        };

        /**
         * Returns the instance of the inner chart from the delegate
         * @returns {sap.core.Control} the instance of the inner chart
         *
         * @private
         */
        Chart.prototype._getInnerChart = function () {
            if (this._bInnerChartReady) {
                return this.getControlDelegate().getInnerChart(this);
            } else {
                Log.error("Trying to acces inner chart while inner chart is not yet initialized!");
            }
        };

        //TODO: Think of a good name
        Chart.prototype._addItems = function () {

        };

        /**
         * Gets the collection model from the binding information
         * @returns {object} Object containing the binding information
         *
         * @experimental
         * @private
         * @ui5-restricted Fiori Elements
         */
        Chart.prototype.getCollectionModel = function () {
            var oBindingInfo = this.getBindingInfo("data");
            return oBindingInfo ? this.getModel(oBindingInfo.model) : null;
        };


        /**
         * Can be used to check whether the chart is initialized
         * After initialization the delegate should be loaded and (in case of autoBindOnInit=true) the inner chart has been created
         * This does not include the inner chart to be bound. Use <code>innerChartBound</code> for it.
         * @returns {Promise} Promise that resolves once MDC Chart is initialized. Contains reference to MDC Chart
         *
         * @experimental
         * @private
         * @ui5-restricted sap.ui.mdc, sap.fe
         */
        Chart.prototype.initialized = function () {
            return this.initializedPromise;
        };

        /**
         * Can be used to check whether the inner chart is initialized and bound
         * @returns {Promise} Promise that resolves once MDC Chart is bound
         *
         * @experimental
         * @private
         * @ui5-restricted sap.ui.mdc, sap.fe
         */
        Chart.prototype.innerChartBound = function () {
            return this.innerChartBoundPromise;
        };

        /**
         * Zooms in the inner chart
         * @param {int} iValue how much steps should be zoomed in
         *
         * @experimental
         * @private
         * @ui5-restricted sap.ui.mdc, sap.fe
         */
        Chart.prototype.zoomIn = function (iValue) {
            if (!iValue) {
                iValue = 10;
            }

            this.getControlDelegate().zoomIn(this, iValue);
        };

        /**
         * Zooms out the inner chart
         * @param {int} iValue how much steps should be zoomed out
         *
         * @experimental
         * @private
         * @ui5-restricted sap.ui.mdc, sap.fe
         */
        Chart.prototype.zoomOut = function (iValue) {
            if (iValue) {
                iValue = 10;
            }

            this.getControlDelegate().zoomOut(this, iValue);
        };

        /**
         * Returns the current zoom information as an object
         * {
         *   "enabled":true,
         *   "currentZoomLevel":0.16
         *   }
         *
         * @returns {Object} current Zoom Information
         *
         * @experimental
         * @private
         * @ui5-restricted sap.ui.mdc, sap.fe
         */
        Chart.prototype.getZoomState = function () {
            return this.getControlDelegate().getZoomState(this);
        };

        Chart.prototype.getSelectionHandler = function () {
            return this.getControlDelegate().getInnerChartSelectionHandler(this);
        };

        Chart.prototype.getChartTypeLayoutConfig = function() {
            return this.getControlDelegate().getChartTypeLayoutConfig();
        };

        Chart.prototype.getAllowedRolesForKinds = function() {
            return this.getControlDelegate().getAllowedRolesForKinds();
        };

        /**
         * Sets the visibility of the legend
         * Calls the Delegates <code>setLegendVisible</code>. Never call the delegates function directly as it would not update the Chart Toolbar!
         * @param {boolean} bVisible true to show legend, false to hide
         *
         * @experimental
         * @private
         * @ui5-restricted Fiori Elements, sap.ui.mdc
         */
        Chart.prototype.setLegendVisible = function (bVisible) {
            this.setProperty("legendVisible", bVisible);

            //Skip if no control delegate; gets propagated by _propagatePropertiesToInnerChart after init
            try {
                this.getControlDelegate().setLegendVisible(this, bVisible);
            } catch (e) {
                Log.info("Trying to set legend visiblity for Chart before delegate was initialized");
            }


            return this;
        };

        /**
         * Sets the ShowChartTooltip Property
         * @param {boolean} bValue true for visible; false for invisible
         * @returns {sap.ui.mdc.Chart} the MDC Chart
         */
        Chart.prototype.setShowChartTooltip = function (bValue) {
            this.setProperty("showChartTooltip", bValue);

            //Skip if no control delegate; gets propagated by _propagatePropertiesToInnerChart after init
            try {
                this.getControlDelegate().setChartTooltipVisibility(this, bValue);
            } catch (e) {
                Log.info("Trying to set tooltip visibility before delegate was initialized");
            }

            return this;
        };

        Chart.prototype.destroy = function() {
            this._bIsDestroyed = true;

            Control.prototype.destroy.apply(this, arguments);
        };

        /**
         * shows the drill-down popover for selection a dimension to drill down to.
         * @param {sap.m.Button} oDrillBtn reference to the drill down button for loacation of the popover
         *
         * @experimental
         * @private
         * @ui5-restricted sap.ui.mdc
         */
        Chart.prototype._showDrillDown = function (oDrillBtn) {
            if (!this.oDrillPopover) {
                if (DrillStackHandler) {
                    this.oDrillPopover = DrillStackHandler.createDrillDownPopover(this);
                    this.oDrillPopover.attachAfterClose(function(){
                        delete this.oDrillPopover;
                    }.bind(this));

                    return DrillStackHandler.showDrillDownPopover(this, oDrillBtn);
                }

                return new Promise(function (resolve, reject) {
                    sap.ui.require([
                        "sap/ui/mdc/chart/DrillStackHandler"
                    ], function (DrillStackHandlerLoaded) {
                        DrillStackHandler = DrillStackHandlerLoaded;
                        this.oDrillPopover = DrillStackHandler.createDrillDownPopover(this);
                        this.oDrillPopover.attachAfterClose(function(){
                            delete this.oDrillPopover;
                        }.bind(this));

                        DrillStackHandler.showDrillDownPopover(this, oDrillBtn)
                            .then(function (oDrillDownPopover) {
                                resolve(oDrillDownPopover);
                            });
                    }.bind(this));
                }.bind(this));
            }
        };

        /**
         * If some properties are set on the MDC Chart while the inner chart is not yet initialized, they need to eb set after initialaization.
         * This methods gets called after inner chart is ready and takes care of that
         *
         * @private
         */
        Chart.prototype._propagatePropertiesToInnerChart = function () {
            //TODO: Can this be set by constructor of inner chart?
            this.setLegendVisible(this.getLegendVisible());
            this.setShowChartTooltip(this.getShowChartTooltip());
            this.setChartType(this.getChartType());
        };

        /**
         * Gets information about the current chart type.
         *
         * @returns {sap.ui.mdc.Chart.ChartTypeInfo} Object containing information about the chart type
         *
         * @experimental
         * @private
         * @ui5-restricted Fiori Elements
         *
         */
        Chart.prototype.getChartTypeInfo = function () {
            var mInfo;

            try {
                mInfo = this.getControlDelegate().getChartTypeInfo(this);
            } catch (error) {
                //Inner chart is not yet ready
                if (!mInfo) {
                    mInfo = {
                        icon: "sap-icon://vertical-bar-chart",
                        text: "Selected Chart Type: Bar Chart"
                    };
                }
            }

            return mInfo;
        };

        /**
         * Gets the available chart types for the current state of the inner chart
         *
         * @returns {array} Array containing the available chart types
         *
         * @experimental
         * @private
         * @ui5-restricted Fiori Elements
         */
        Chart.prototype.getAvailableChartTypes = function () {
            return this.getControlDelegate().getAvailableChartTypes(this);
        };


        /**
         * Sets the MDC Chart to a specific chart type
         * @param {string} sChartType the name of the new chart type
         * @returns {sap.ui.mdc.chart} reference to <code>this</code> for method chaining
         */
        Chart.prototype.setChartType = function (sChartType) {
            this.setProperty("chartType", sChartType);

            try {
                this.getControlDelegate().setChartType(this, sChartType);
            } catch (e) {
                Log.info("Trying to set chart type for Chart before delegate was initialized");
            }

            return this;
        };

        /**
         * Gets the managed object model.
         * @returns {sap.ui.model.base.ManagedObjectModel} the managed object model
         *
         * @experimental
         * @private
         * @ui5-restricted Fiori Elements
         */
        Chart.prototype.getManagedObjectModel = function () {
            return this._oManagedObjectModel;
        };

        /**
         * This is a callback function which is called from the delegate once the inner chart finished loading data
         * Updates the Toolbar
         * Fires the innerChartLoadedData event
         *
         * @private
         */
        Chart.prototype._innerChartDataLoadComplete = function (mArguments) {
            this.setBusy(false);
            this._renderOverlay(false);

            this.getControlDelegate().requestToolbarUpdate(this);

            this.fireEvent("innerChartLoadedData ", {
                innerChart: this.getControlDelegate().getInnerChart(this)
            });
        };

        /**
         * Fetches the current state of the chart (as a JSON)
         * Needed for P13n to fetch current state
         *
         * @experimental
         * @private
         * @returns {Object} Current state of the chart
         * @ui5-restricted sap.ui.mdc
         */
        Chart.prototype.getCurrentState = function () {
            var oState = {};
            var aP13nMode = this.getP13nMode();

            if (aP13nMode) {
                if (aP13nMode.indexOf("Item") > -1) {
                    oState.items = this._getVisibleProperties();
                }

                if (aP13nMode.indexOf("Sort") > -1) {
                    oState.sorters = this._getSortedProperties();
                }

                if (aP13nMode.indexOf("Filter") > -1) {
                    oState.filter = this.getFilterConditions();
                }
            }

            return oState;
        };

        /**
         * Returns the currently visible Properties
         * Needed for P13n
         * @returns {array} Array containing the currently visible properties
         *
         * @private
         */
        Chart.prototype._getVisibleProperties = function () {
            var aProperties = [];
            this.getItems().forEach(function (oItem) {
                aProperties.push({
                    name: oItem.getName(),
                    role: oItem.getRole()
                });

            });
            return aProperties;
        };

        /**
         * Returns the currently sorted Properties
         * Needed for P13n
         * @returns {array} Array containing the currently sorted properties
         *
         * @private
         */
        Chart.prototype._getSortedProperties = function () {
            return this.getSortConditions() ? this.getSortConditions().sorters : [];
        };

        /**
         * Returns sorters available for the data
         *
         * @returns {array} Array containing available sorters
         *
         * @experimental
         * @private
         * @ui5-restricted sap.ui.mdc
         */
        Chart.prototype._getSorters = function () {
            var aSorters;
            var aSorterProperties = this.getSortConditions() ? this.getSortConditions().sorters : [];

            aSorterProperties.forEach(function (oSortProp) {

                var oMDCItem = this.getItems().find(function (oProp) {
                    return oProp.getName() === oSortProp.name;
                });

                //Ignore not visible Items
                if (!oMDCItem) {
                    return;
                }

                //TODO: Check for inResultDimensions
                var oSorter = this.getControlDelegate().getSorterForItem(oMDCItem, oSortProp);

                if (aSorters) {
                    aSorters.push(oSorter);
                } else {
                    aSorters = [
                        oSorter
                    ];//[] has special meaning in sorting
                }
            }.bind(this));

            return aSorters;

        };

        /**
         * Returns the fetched properties from the delegate
         *
         * @private
         */
        Chart.prototype._getPropertyData = function () {

            if (!this.aFetchedProperties) {
                //retrieve the data
                this.aFetchedProperties = this.getControlDelegate().fetchProperties(this);
            } else {
                //take the already instantiated data
                return this.aFetchedProperties;
            }

        };

        Chart.prototype._getTypeBtnActive = function(){
            return !!this._typeBtnActive;
        };

        /**
		 * Callback for when fuilters changed
		 * Activates the overlay on the MDC Chart
		 *
		 * @param oEvent filter changed event
		 *
		 * @experimental
		 * @private
		 * @ui5-restricted Fiori Elements, sap.ui.mdc
		 */
		Chart.prototype._onFiltersChanged = function(oEvent) {
			if (this._bInnerChartReady && this.getControlDelegate() && this.getControlDelegate().getInnerChartBound(this) && oEvent.getParameter("conditionsBased")) {
				this._renderOverlay(true);
			}
		};

        Chart.prototype.setVariant = function(oControl) {
            this.setAggregation("variant", oControl);

            //Only add VM directly when Toolbar already exists; otherwise VM will be added during init of toolbar
            if (this.getAggregation("_toolbar")){
                this.getAggregation("_toolbar").addVariantManagement(oControl);
            }


            return this;
        };

        /**
		 * Adds/Removes the overlay shown above the inner chart
		 * @param {boolean} bShow true to show overlay, false to hide
		 *
		 * @experimental
		 * @private
		 * @ui5-restricted Fiori Elements, sap.ui.mdc
		 */
		Chart.prototype._renderOverlay = function(bShow) {

			if (this.getControlDelegate().getInnerChart(this)) {

				var $this = this.getControlDelegate().getInnerChart(this).$(), $overlay = $this.find(".sapUiMdcChartOverlay");
				if (bShow && $overlay.length === 0) {
					$overlay = jQuery("<div>").addClass("sapUiOverlay sapUiMdcChartOverlay").css("z-index", "1");
					$this.append($overlay);
				} else if (!bShow) {
					$overlay.remove();
				}
			}
		};

        Chart.prototype.addAction = function(oControl) {
            if (oControl.getMetadata().getName() !== "sap.ui.mdc.actiontoolbar.ActionToolbarAction") {
                oControl = new ActionToolbarAction(oControl.getId() + "-action", {
                    action: oControl
                });
            }

            return Control.prototype.addAggregation.apply(this, ["actions", oControl]);
        };

        return Chart;
    });