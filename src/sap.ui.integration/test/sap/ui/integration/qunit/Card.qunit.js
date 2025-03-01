/* global QUnit, sinon */

sap.ui.define([
	"sap/ui/integration/widgets/Card",
	"sap/ui/integration/cards/BaseContent",
	"sap/ui/integration/cards/Header",
	"sap/ui/integration/cards/filters/SelectFilter",
	"sap/ui/integration/util/DataProvider",
	"sap/ui/integration/util/Utils",
	"sap/ui/core/Core",
	"sap/ui/core/Manifest",
	"sap/base/Log",
	"sap/ui/core/ComponentContainer",
	"sap/ui/base/Event",
	"sap/ui/core/UIComponent",
	"sap/m/BadgeCustomData",
	"sap/m/MessageStrip",
	"sap/ui/integration/util/DataProviderFactory",
	"sap/m/library",
	"sap/base/util/deepExtend",
	"sap/base/util/LoaderExtensions",
	"sap/m/HBox",
	"sap/ui/model/json/JSONModel",
	"sap/m/IllustratedMessageType",
	"sap/m/IllustratedMessageSize"
],
	function (
		Card,
		BaseContent,
		Header,
		Filter,
		DataProvider,
		Utils,
		Core,
		CoreManifest,
		Log,
		ComponentContainer,
		Event,
		UIComponent,
		BadgeCustomData,
		MessageStrip,
		DataProviderFactory,
		mLibrary,
		deepExtend,
		LoaderExtensions,
		HBox,
		JSONModel,
		IllustratedMessageType,
		IllustratedMessageSize
	) {
		"use strict";

		var DOM_RENDER_LOCATION = "qunit-fixture";

		var AvatarColor = mLibrary.AvatarColor;

		var oManifest_Header = {
			"sap.app": {
				"id": "test.card.card1"
			},
			"sap.card": {
				"type": "List",
				"header": {
					"title": "L3 Request list content Card",
					"subTitle": "Card subtitle",
					"icon": {
						"src": "sap-icon://accept"
					},
					"status": {
						"text": "100 of 200"
					},
					"dataTimestamp": "2021-03-18T12:00:00Z"
				}
			}
		};

		var oManifest_ListCard = {
			"sap.app": {
				"id": "my.card.qunit.test.ListCard"
			},
			"sap.card": {
				"type": "List",
				"header": {
					"title": "L3 Request list content Card",
					"subTitle": "Card subtitle",
					"icon": {
						"src": "sap-icon://accept"
					},
					"status": {
						"text": "100 of 200"
					}
				},
				"content": {
					"data": {
						"json": [
							{
								"Name": "Notebook Basic 15",
								"Description": "Notebook Basic 15 with 2,80 GHz quad core, 15\" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1000",
								"SubCategoryId": "Notebooks",
								"state": "Information",
								"info": "27.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Basic 17",
								"Description": "Notebook Basic 17 with 2,80 GHz quad core, 17\" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1001",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "27.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Basic 18",
								"Description": "Notebook Basic 18 with 2,80 GHz quad core, 18\" LCD, 8 GB DDR3 RAM, 1000 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1002",
								"SubCategoryId": "Notebooks",
								"state": "Warning",
								"info": "9.45 EUR",
								"infoState": "Error"
							},
							{
								"Name": "Notebook Basic 19",
								"Description": "Notebook Basic 19 with 2,80 GHz quad core, 19\" LCD, 8 GB DDR3 RAM, 1000 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1003",
								"SubCategoryId": "Notebooks",
								"state": "Error",
								"info": "9.45 EUR",
								"infoState": "Error"
							},
							{
								"Name": "ITelO Vault",
								"Description": "Digital Organizer with State-of-the-Art Storage Encryption",
								"Id": "HT-1007",
								"SubCategoryId": "PDAs & Organizers",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Professional 15",
								"Description": "Notebook Professional 15 with 2,80 GHz quad core, 15\" Multitouch LCD, 8 GB DDR3 RAM, 500 GB SSD - DVD-Writer (DVD-R/+R/-RW/-RAM),Windows 8 Pro",
								"Id": "HT-1010",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Professional 26",
								"Description": "Notebook Professional 15 with 2,80 GHz quad core, 15\" Multitouch LCD, 8 GB DDR3 RAM, 500 GB SSD - DVD-Writer (DVD-R/+R/-RW/-RAM),Windows 8 Pro",
								"Id": "HT-1022",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Professional 27",
								"Description": "Notebook Professional 15 with 2,80 GHz quad core, 15\" Multitouch LCD, 8 GB DDR3 RAM, 500 GB SSD - DVD-Writer (DVD-R/+R/-RW/-RAM),Windows 8 Pro",
								"Id": "HT-1024",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							}
						]
					},
					"item": {
						"title": {
							"label": "Title",
							"value": "{Name}"
						},
						"description": {
							"label": "Description",
							"value": "{Description}"
						},
						"highlight": "{state}",
						"info": {
							"value": "{info}",
							"state": "{infoState}"
						}
					}
				}
			}
		};

		var oManifest_ListCard2 = {
			"sap.app": {
				"id": "test.card.card3"
			},
			"sap.card": {
				"type": "List",
				"header": {
					"title": "L3 Request list content Card"
				},
				"content": {
					"data": {
						"json": [
							{
								"Name": "Notebook Basic 15",
								"Description": "Notebook Basic 15 with 2,80 GHz quad core, 15\" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1000",
								"SubCategoryId": "Notebooks",
								"state": "Information",
								"info": "27.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Basic 17",
								"Description": "Notebook Basic 17 with 2,80 GHz quad core, 17\" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1001",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "27.45 EUR",
								"infoState": "Success"

							},
							{
								"Name": "Notebook Basic 18",
								"Description": "Notebook Basic 18 with 2,80 GHz quad core, 18\" LCD, 8 GB DDR3 RAM, 1000 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1002",
								"SubCategoryId": "Notebooks",
								"state": "Warning",
								"info": "9.45 EUR",
								"infoState": "Error"
							},
							{
								"Name": "Notebook Basic 19",
								"Description": "Notebook Basic 19 with 2,80 GHz quad core, 19\" LCD, 8 GB DDR3 RAM, 1000 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1003",
								"SubCategoryId": "Notebooks",
								"state": "Error",
								"info": "9.45 EUR",
								"infoState": "Error"
							},
							{
								"Name": "ITelO Vault",
								"Description": "Digital Organizer with State-of-the-Art Storage Encryption",
								"Id": "HT-1007",
								"SubCategoryId": "PDAs & Organizers",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Professional 15",
								"Description": "Notebook Professional 15 with 2,80 GHz quad core, 15\" Multitouch LCD, 8 GB DDR3 RAM, 500 GB SSD - DVD-Writer (DVD-R/+R/-RW/-RAM),Windows 8 Pro",
								"Id": "HT-1010",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Professional 26",
								"Description": "Notebook Professional 15 with 2,80 GHz quad core, 15\" Multitouch LCD, 8 GB DDR3 RAM, 500 GB SSD - DVD-Writer (DVD-R/+R/-RW/-RAM),Windows 8 Pro",
								"Id": "HT-1022",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Professional 27",
								"Description": "Notebook Professional 15 with 2,80 GHz quad core, 15\" Multitouch LCD, 8 GB DDR3 RAM, 500 GB SSD - DVD-Writer (DVD-R/+R/-RW/-RAM),Windows 8 Pro",
								"Id": "HT-1024",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							}
						]
					},
					"item": {
						"title": "{Name}",
						"description": "{Description}"
					}
				}
			}
		};

		var oManifest_ListCard_NoHeader = {
			"sap.app": {
				"id": "my.card.qunit.test.ListCard"
			},
			"sap.card": {
				"type": "List",
				"content": {
					"data": {
						"json": [
							{
								"Name": "Notebook Basic 15",
								"Description": "Notebook Basic 15 with 2,80 GHz quad core, 15\" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1000",
								"SubCategoryId": "Notebooks",
								"state": "Information",
								"info": "27.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Basic 17",
								"Description": "Notebook Basic 17 with 2,80 GHz quad core, 17\" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1001",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "27.45 EUR",
								"infoState": "Success"

							},
							{
								"Name": "Notebook Basic 18",
								"Description": "Notebook Basic 18 with 2,80 GHz quad core, 18\" LCD, 8 GB DDR3 RAM, 1000 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1002",
								"SubCategoryId": "Notebooks",
								"state": "Warning",
								"info": "9.45 EUR",
								"infoState": "Error"
							},
							{
								"Name": "Notebook Basic 19",
								"Description": "Notebook Basic 19 with 2,80 GHz quad core, 19\" LCD, 8 GB DDR3 RAM, 1000 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1003",
								"SubCategoryId": "Notebooks",
								"state": "Error",
								"info": "9.45 EUR",
								"infoState": "Error"
							},
							{
								"Name": "ITelO Vault",
								"Description": "Digital Organizer with State-of-the-Art Storage Encryption",
								"Id": "HT-1007",
								"SubCategoryId": "PDAs & Organizers",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Professional 15",
								"Description": "Notebook Professional 15 with 2,80 GHz quad core, 15\" Multitouch LCD, 8 GB DDR3 RAM, 500 GB SSD - DVD-Writer (DVD-R/+R/-RW/-RAM),Windows 8 Pro",
								"Id": "HT-1010",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Professional 26",
								"Description": "Notebook Professional 15 with 2,80 GHz quad core, 15\" Multitouch LCD, 8 GB DDR3 RAM, 500 GB SSD - DVD-Writer (DVD-R/+R/-RW/-RAM),Windows 8 Pro",
								"Id": "HT-1022",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Professional 27",
								"Description": "Notebook Professional 15 with 2,80 GHz quad core, 15\" Multitouch LCD, 8 GB DDR3 RAM, 500 GB SSD - DVD-Writer (DVD-R/+R/-RW/-RAM),Windows 8 Pro",
								"Id": "HT-1024",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "29.45 EUR",
								"infoState": "Success"
							}
						]
					},
					"item": {
						"title": {
							"label": "Title",
							"value": "{Name}"
						},
						"description": {
							"label": "Description",
							"value": "{Description}"
						},
						"highlight": "{state}",
						"info": {
							"value": "{info}",
							"state": "{infoState}"
						}
					}
				}
			}
		};

		var oManifest_DefaultParameters = {
			"sap.app": {
				"id": "test.card.card5"
			},
			"sap.card": {
				"configuration": {
					"parameters": {
						"city": {
							"value": "Vratza"
						},
						"country": {
							"value": "Bulgaria"
						},
						"testObject": {
							"value": {
								"text": "OBJECT_VALUE"
							}
						},
						"testArray": {
							"value": [
								{
									"text": "ARRAY_VALUE_0"
								},
								{
									"text": "ARRAY_VALUE_1"
								}
							]
						}
					}
				},
				"type": "List",
				"header": {
					"title": "Default manifest parameters",
					"subTitle": "Default parameter from manifest"
				},
				"content": {
					"data": {
						"json": [
							{
								"Name": "Notebook Basic 15",
								"Description": "Notebook Basic 15 with 2,80 GHz quad core, 15\" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1000",
								"SubCategoryId": "Notebooks",
								"state": "Information",
								"info": "27.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Basic 17",
								"Description": "Notebook Basic 17 with 2,80 GHz quad core, 17\" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1001",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "27.45 EUR",
								"infoState": "Success"

							}
						]
					},
					"item": {
						"title": {
							"label": "{{title_label}}",
							"value": "{Name}, {{parameters.TODAY_ISO}}"
						},
						"description": {
							"value": "Stationed in: {{parameters.city}}, {{parameters.country}}. City again: {{parameters.city}}"
								+ "Other test: {{parameters.testObject.text}} and {{parameters.testArray.0.text}} and {{parameters.testArray.1.text}}"
						},
						"highlight": "{state}"
					}
				}
			}
		};

		var oManifest_WithoutParameters = {
			"sap.app": {
				"id": "test.card.card6"
			},
			"sap.card": {
				"type": "List",
				"header": {
					"title": "Default manifest parameters",
					"subTitle": "Default parameter from manifest"
				},
				"content": {
					"data": {
						"json": [
							{
								"Name": "Notebook Basic 15",
								"Description": "Notebook Basic 15 with 2,80 GHz quad core, 15\" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1000",
								"SubCategoryId": "Notebooks",
								"state": "Information",
								"info": "27.45 EUR",
								"infoState": "Success"
							},
							{
								"Name": "Notebook Basic 17",
								"Description": "Notebook Basic 17 with 2,80 GHz quad core, 17\" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro",
								"Id": "HT-1001",
								"SubCategoryId": "Notebooks",
								"state": "Success",
								"info": "27.45 EUR",
								"infoState": "Success"

							}
						]
					},
					"item": {
						"title": {
							"label": "{{title_label}}",
							"value": "{Name}, {{parameters.TODAY_ISO}}"
						},
						"description": {
							"value": "Stationed in: {{parameters.city}}, {{parameters.country}}"
						},
						"highlight": "{state}"
					}
				}
			}
		};

		var oManifest_TableCard = {
			"sap.app": {
				"id": "my.card.qunit.test.TableCard"
			},
			"sap.card": {
				"type": "Table",
				"header": {
					"title": "Sales Orders for Key Accounts"
				},
				"content": {
					"data": {
						"json": [
							{
								"salesOrder": "5000010050",
								"customer": "Robert Brown Entertainment",
								"status": "Delivered",
								"statusState": "Success",
								"orderUrl": "http://www.sap.com",
								"percent": 30,
								"percentValue": "30%",
								"progressState": "Error",
								"iconSrc": "sap-icon://help"
							},
							{
								"salesOrder": "5000010051",
								"customer": "Entertainment Argentinia",
								"status": "Canceled",
								"statusState": "Error",
								"orderUrl": "http://www.sap.com",
								"percent": 70,
								"percentValue": "70 of 100",
								"progressState": "Success",
								"iconSrc": "sap-icon://help"
							},
							{
								"salesOrder": "5000010052",
								"customer": "Brazil Technologies",
								"status": "In Progress",
								"statusState": "Warning",
								"orderUrl": "http://www.sap.com",
								"percent": 55,
								"percentValue": "55GB of 100",
								"progressState": "Warning",
								"iconSrc": "sap-icon://help"
							},
							{
								"salesOrder": "5000010053",
								"customer": "Quimica Madrilenos",
								"status": "Delivered",
								"statusState": "Success",
								"orderUrl": "http://www.sap.com",
								"percent": 10,
								"percentValue": "10GB",
								"progressState": "Error",
								"iconSrc": "sap-icon://help"
							},
							{
								"salesOrder": "5000010054",
								"customer": "Development Para O Governo",
								"status": "Delivered",
								"statusState": "Success",
								"orderUrl": "http://www.sap.com",
								"percent": 100,
								"percentValue": "100%",
								"progressState": "Success",
								"iconSrc": "sap-icon://help"
							}
						]
					},
					"row": {
						"columns": [
							{
								"title": "Sales Order",
								"value": "{salesOrder}",
								"identifier": true
							},
							{
								"title": "Customer",
								"value": "{customer}"
							},
							{
								"title": "Status",
								"value": "{status}",
								"state": "{statusState}",
								"hAlign": "End"
							},
							{
								"title": "Order ID",
								"value": "{orderUrl}",
								"url": "{orderUrl}"
							},
							{
								"title": "Progress",
								"progressIndicator": {
									"percent": "{percent}",
									"text": "{percentValue}",
									"state": "{progressState}"
								}
							},
							{
								"title": "Avatar",
								"icon": {
									"src": "{iconSrc}"
								}
							},
							{
								"title": "Sales Order",
								"value": "{salesOrder}",
								"identifier": {
									"url": "{orderUrl}"
								}
							}
						]
					}
				}
			}
		};

		var oManifest_AvatarHeader = {
			"sap.app": {
				"id": "test.card.card8"
			},
			"sap.card": {
				"type": "List",
				"header": {
					"actions": [
						{
							"type": "Navigation",
							"url": "https://www.sap.com"
						}
					],
					"title": "L3 Request list content Card",
					"subTitle": "Card subtitle",
					"icon": {
						"text": "AJ",
						"shape": "Circle",
						"alt": "Some alternative text", // Will be ignored as its not present in the Avatar control atm.
						"color": "#FF0000" // Will be ignored as its not present in the Avatar control atm.
					},
					"status": {
						"text": "100 of 200"
					}
				}
			}
		};

		var oManifest_NumericHeader = {
			"sap.app": {
				"id": "test.card.card9"
			},
			"sap.card": {
				"type": "List",
				"header": {
					"type": "Numeric",
					"data": {
						"json": {
							"n": "56",
							"u": "%",
							"trend": "Up",
							"valueColor": "Good"
						}
					},
					"title": "Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation ",
					"subTitle": "Forecasted goal achievement depending on business logic and other important information Forecasted goal achievement depending on business logic and other important information",
					"unitOfMeasurement": "EUR",
					"mainIndicator": {
						"number": "{n}",
						"unit": "{u}",
						"trend": "{trend}",
						"state": "{valueColor}"
					},
					"dataTimestamp": "2021-03-18T12:00:00Z",
					"details": "Details, additional information, will directly truncate after there is no more space.Details, additional information, will directly truncate after there is no more space.",
					"sideIndicators": [
						{
							"title": "Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target",
							"number": "3252.234",
							"unit": "K"
						},
						{
							"title": "Long Deviation Long Deviation",
							"number": "22.43",
							"unit": "%"
						}
					]
				}
			}
		};

		var oManifest_NumericHeader2 = {
			"sap.app": {
				"id": "test.card.card10"
			},
			"sap.card": {
				"type": "List",
				"header": {
					"type": "Numeric",
					"title": "Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation ",
					"subTitle": "Forecasted goal achievement depending on business logic and other important information Forecasted goal achievement depending on business logic and other important information",
					"unitOfMeasurement": "EUR",
					"mainIndicator": {
						"number": "56",
						"unit": "%",
						"trend": "Up",
						"state": "Good"
					},
					"details": "Details, additional information, will directly truncate after there is no more space.Details, additional information, will directly truncate after there is no more space.",
					"sideIndicators": [
						{
							"title": "Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target Long Target",
							"number": "3252.234",
							"unit": "K"
						},
						{
							"title": "Long Deviation Long Deviation",
							"number": "22.43",
							"unit": "%"
						}
					]
				}
			}
		};

		var oManifest_NumericHeader_OnlyTitleAndSubtitle = {
			"sap.app": {
				"id": "test.card.card11"
			},
			"sap.card": {
				"type": "List",
				"header": {
					"type": "Numeric",
					"title": "Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation Project Cloud Transformation ",
					"subTitle": "Forecasted goal achievement depending on business logic and other important information Forecasted goal achievement depending on business logic and other important information",
					"unitOfMeasurement": "EUR"
				}
			}
		};

		var oManifest_ComponentCardAllInOne = {
			"_version": "1.12.0",
			"sap.app": {
				"id": "sap.f.cardsdemo.cardcontent.componentContent.allInOne",
				"type": "card",
				"applicationVersion": {
					"version": "1.0.0"
				}
			},
			"sap.card": {
				"type": "Component"
			}
		};

		var oManifest_Today_Parameter = {
			"sap.app": {
				"id": "test.card.card13"
			},
			"sap.card": {
				"type": "List",
				"header": {
					"title": "Default manifest parameters",
					"subTitle": "{{parameters.TODAY_ISO}}"
				}
			}
		};

		var oManifest_Today_And_Location_Parameter = {
			"sap.app": {
				"id": "test.card.card14"
			},
			"sap.card": {
				"type": "List",
				"header": {
					"title": "Default manifest parameters",
					"subTitle": "{{parameters.TODAY_ISO}} and {{parameters.LOCALE}}"
				}
			}
		};

		var oManifest_CustomModels = {
			"sap.app": {
				"id": "test.card.card15"
			},
			"sap.card": {
				"type": "List",
				"data": {
					"name": "cities"
				},
				"content": {
					"data": {
						"path": "cities>/items"
					},
					"item": {
						"title": "{cities>name}"
					}
				}
			}
		};

		var oManifest_DefaultHeader_NoContent = {
			"sap.app": {
				"id": "test.card.card16",
				"type": "card"
			},
			"sap.card": {
				"type": "Object",
				"header": {
					"title": "Header Title",
					"data": {
						"request": {
							"url": "fake-url"
						}
					}
				}
			}
		};

		var oManifest_Bad_Url_List = {
			"sap.app": {
				"id": "test.card.badDataUrl"
			},
			"sap.card": {
				"type": "List",
				"header": {},
				"content": {
					"item": {}
				},
				"data": {
					"json": []
				}
			}
		};

		var oManifest_No_Data_List = {
			"sap.app": {
				"id": "test.card.NoData"
			},
			"sap.card": {
				"type": "List",
				"header": {},
				"content": {
					"item": {
						"title": ""
					}
				},
				"data": {
					"json": []
				}
			}
		};
		var oManifest_No_Data_Table = {
			"sap.app": {
				"id": "test.card.NoData"
			},
			"sap.card": {
				"type": "Table",
				"header": {},
				"content": {
					"row": {
						"columns": [{
							"title": "Sales Order",
							"value": "{salesOrder}",
							"identifier": true
						},
							{
								"title": "Customer",
								"value": "{customerName}"
							},
							{
								"title": "Net Amount",
								"value": "{netAmount}",
								"hAlign": "End"
							},
							{
								"title": "Status",
								"value": "{status}",
								"state": "{statusState}"
							},
							{
								"title": "Delivery Progress",
								"progressIndicator": {
									"percent": "{deliveryProgress}",
									"text": "{= format.percent(${deliveryProgress} / 100)}",
									"state": "{statusState}"
								}
							}
						]
					}
				},
				"data": {
					json: []
				}
			}
		};

		function testContentInitialization(oManifest, assert) {

			// Arrange
			var done = assert.async();

			var oCard = new Card("somecard", {
				manifest: oManifest,
				width: "400px",
				height: "600px"
			});

			// Act
			oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();

			// Assert
			assert.notOk(oCard.getAggregation("_header"), "Card header should be empty.");
			assert.notOk(oCard.getAggregation("_content"), "Card content should be empty.");
			assert.ok(oCard.getDomRef(), "Card should be rendered.");
			assert.equal(oCard.getDomRef().clientWidth, 398, "Card should have width set to 398px.");
			assert.equal(oCard.getDomRef().clientHeight, 598, "Card should have height set to 598px.");

			oCard.attachEvent("_ready", function () {
				Core.applyChanges();

				// Assert
				assert.ok(oCard.getAggregation("_header").getDomRef(), "Card header should be rendered.");
				assert.ok(oCard.getAggregation("_content").getDomRef(), "Card content should be rendered.");

				// Cleanup
				oCard.destroy();
				done();
			});
		}

		function testComponentContentCreation(oCardManifest, oExpectedComponentManifest, assert) {
			// Arrange
			var done = assert.async(),
				oStub = sinon.stub(ComponentContainer.prototype, "applySettings"),
				oCard = new Card(),
				oStubEvent = new Event("componentCreated", this, {
					component: new UIComponent()
				});

			assert.expect(1);
			oStub.callsFake(function (mSettings) {
				assert.deepEqual(
					mSettings.manifest,
					oExpectedComponentManifest,
					"A ComponentContainer is created with expected settings"
				);

				mSettings.componentCreated(oStubEvent);

				oStub.restore();
				oCard.destroy();
				done();
			});

			// Act
			oCard.setManifest(oCardManifest);
			oCard.placeAt(DOM_RENDER_LOCATION);
		}

		QUnit.module("Init");

		QUnit.test("Initialization - ListContent", function (assert) {
			testContentInitialization(oManifest_ListCard, assert);
		});

		QUnit.test("Initialization - TableContent", function (assert) {
			testContentInitialization(oManifest_TableCard, assert);
		});

		QUnit.test("Empty header", function (assert) {
			var done = assert.async();

			var oCard = new Card("somecard", {
				manifest: oManifest_ListCard_NoHeader,
				width: "400px",
				height: "600px"
			});

			// Act
			oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();

			oCard.attachEvent("_ready", function () {
				Core.applyChanges();

				// Assert
				setTimeout(function () {
					assert.notOk(oCard.getAggregation("_header").getDomRef(), "Card header should not be rendered.");

					// Cleanup
					oCard.destroy();
					done();
				}, 300);
			});
		});

		QUnit.test("Rendered classes", function (assert) {
			// Arrange
			var oCard = new Card();

			// Act
			oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();

			// Assert
			assert.ok(oCard.$().hasClass("sapUiIntCard"), "Class is added to the root div");

			// Clean up
			oCard.destroy();
		});

		QUnit.test("Register module path", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = new Card({
					manifest: oManifest_ListCard
				}),
				fnRegisterSpy = sinon.spy(LoaderExtensions, "registerResourcePath");

			oCard.attachEventOnce("_ready", function () {
				// Assert
				assert.ok(fnRegisterSpy.called, "LoaderExtensions.registerResourcePath is called.");
				assert.ok(fnRegisterSpy.calledWith("my/card/qunit/test/ListCard", "resources/my/card/qunit/test/ListCard/"), "LoaderExtensions.registerResourcePath is called with correct params.");

				// Clean up
				oCard.destroy();
				fnRegisterSpy.restore();
				done();
			});

			// Act
			oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("Default model is not propagated", function (assert) {
			// Arrange
			var oContainer = new HBox({
					items: [
						new Card({
							manifest: oManifest_ListCard
						})
					]
				}),
				oModel = new JSONModel({"test": "propagated value"}),
				oCard;

			oContainer.setModel(oModel);

			oCard = oContainer.getItems()[0];

			// Act
			oContainer.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();

			// Assert
			assert.strictEqual(oCard.getModel().getProperty("/test"), undefined, "Default model is not propagated to the card.");

			// Clean up
			oContainer.destroy();
			oModel.destroy();
		});

		QUnit.test("Fundamental errors are logged", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = new Card();

			oCard.attachEvent("_ready", function () {
				var aErrors = oCard.getFundamentalErrors();

				// Assert
				assert.ok(aErrors.length, "Error that the section 'sap.card' is missing is logged.");

				// Clean up
				oCard.destroy();

				done();
			});

			// Act
			oCard.setManifest({});
			oCard.startManifestProcessing();
		});

		QUnit.module("Methods", {
			beforeEach: function () {
				this.oCard = new Card({
					width: "400px",
					height: "600px"
				});
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("setManifest - correct and incorrect", function (assert) {

			var done = assert.async(),
				oManifest_WrongType = deepExtend({}, oManifest_ListCard);

			oManifest_WrongType["sap.card"].type = "Wrong";

			// Arrange
			this.oCard.attachEventOnce("_ready", function () {

				// Arrange
				this.oCard.attachEventOnce("_ready", function () {

					// Arrange
					this.oCard.attachEventOnce("_ready", function () {

						// Assert
						assert.ok(true, "Exception is not thrown");

						done();
					});

					this.oCard.setManifest(oManifest_ListCard);

				}.bind(this));

				this.oCard.setManifest(oManifest_WrongType);

			}.bind(this));

			this.oCard.setManifest(oManifest_ListCard);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("setManifest - to undefined and then set again", function (assert) {
			var done = assert.async(),
				oCard = this.oCard;

			oCard.attachEventOnce("_ready", function () {
				// Act - set manifest to undefined
				oCard.setManifest(undefined);
				Core.applyChanges();

				oCard.attachEventOnce("_ready", function () {
					assert.ok(true, "Manifest can be set correctly second time after it was set to undefined.");
					done();
				});

				// Act - set correct manifest
				oCard.setManifest(oManifest_ListCard);
				Core.applyChanges();
			});

			oCard.setManifest(oManifest_ListCard);
			oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("createManifest called twice", function (assert) {
			var done = assert.async(),
				oStub = sinon.stub(this.oCard, "_setCardContent").callsFake(function () {
					assert.ok("_setCardContent is called only once and error is not thrown.");

					oStub.restore();

					done();
				});

			this.oCard.createManifest(oManifest_ListCard);

			this.oCard._destroyManifest();
			this.oCard.createManifest(oManifest_ListCard);
		});

		QUnit.test("setManifest with and without translated texts", function (assert) {

			var done = assert.async(),
				oLoadI18nSpy = sinon.spy(CoreManifest.prototype, "_loadI18n");

			// Arrange
			this.oCard.attachEventOnce("_ready", function () {

				Core.applyChanges();

				// Assert
				assert.ok(oLoadI18nSpy.notCalled, "translation file is not fetched");

				// Arrange
				this.oCard.attachEventOnce("_ready", function () {

					Core.applyChanges();

					// Assert
					assert.ok(oLoadI18nSpy.called, "translation file is fetched");

					// Clean up
					oLoadI18nSpy.restore();
					done();
				});

				this.oCard.setManifest("test-resources/sap/ui/integration/qunit/testResources/cardWithTranslations/manifest.json");

			}.bind(this));

			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Manifest works if it has very deep structure", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = this.oCard,
				oManifest = {
					"sap.app": {
						"id": "test.card.deepStructure"
					},
					"sap.card": {
						"type": "List",
						"data": {

						}
					}
				},
				iDepth,
				oCurrentLevel = oManifest["sap.card"].data;

			for (iDepth = 0; iDepth < 200; iDepth++) {
				oCurrentLevel.depthTest = {
					level: iDepth
				};

				oCurrentLevel = oCurrentLevel.depthTest;
			}

			oCard.attachManifestReady(function () {
				// Assert
				assert.ok(true, "Manifest is set, there is no error.");
				done();
			});

			// Act
			oCard.setManifest(oManifest);
			oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("getManifestRawJson", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = this.oCard,
				oManifest = oManifest_ListCard;

			oCard.attachManifestReady(function () {
				// Assert
				assert.deepEqual(oCard.getManifestRawJson(), oManifest, "Method getManifestRawJson returns the original raw json.");
				done();
			});

			// Act
			oCard.setManifest(oManifest);
			oCard.setManifestChanges([
				{ content: { header: { title: "Changed title" } } }
			]);
			oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("getDataProviderFactory", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = this.oCard;

			oCard.attachManifestApplied(function () {
				var oDataProviderFactory = oCard.getDataProviderFactory();

				// Assert
				assert.ok(oDataProviderFactory, "Method getDataProviderFactory returns the factory.");
				assert.ok(oDataProviderFactory instanceof DataProviderFactory, "The result is of type sap.ui.integration.util.DataProviderFactory.");
				done();
			});

			// Act
			oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("getRuntimeUrl", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = this.oCard,
				oManifest = {
					"sap.app": {
						"id": "sample.card"
					}
				},
				mSamples = new Map([
					["", "resources/sample/card/"],

					["//some.json", "//some.json"],

					["./", "resources/sample/card/./"],
					["./images/Avatar.png", "resources/sample/card/./images/Avatar.png"],

					["/", "resources/sample/card/"],
					["/some.json", "resources/sample/card/some.json"],

					["http://sap.com", "http://sap.com"],
					["https://sap.com", "https://sap.com"],

					["../some.json", "resources/sample/card/../some.json"],
					["some.json", "resources/sample/card/some.json"]
				]);

			oCard.attachManifestReady(function () {
				// Assert
				mSamples.forEach(function (sExpectedResult, sUrl) {
					var sResult = oCard.getRuntimeUrl(sUrl);

					assert.strictEqual(sResult, sExpectedResult, "Result is correct for '" + sUrl + "'.");
				});
				done();
			});

			// Act
			oCard.setManifest(oManifest);
			oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.module("showMessage", {
			beforeEach: function () {
				this.oCard = new Card({
					width: "400px",
					height: "600px"
				});
				this.oCard.placeAt(DOM_RENDER_LOCATION);
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("showMessage called on a card without manifest", function (assert) {
			// Arrange
			var oLogSpy = this.spy(Log, "error");

			// Act
			this.oCard.showMessage();

			// Assert
			assert.ok(oLogSpy.calledWith("'showMessage' cannot be used before the card instance is ready. Consider using the event 'manifestApplied' event."), "Error should be logged in the console");
		});

		QUnit.test("showMessage delegates the call to BaseContent once created", function (assert) {
			var done = assert.async();
			this.stub(BaseContent.prototype, "showMessage")
				.callsFake(function () {
					// Assert
					assert.ok(true, "showMessage of the content should be called");
					done();
				});

			this.oCard.attachManifestApplied(function () {
				// Act
				this.oCard.showMessage();
			}.bind(this));

			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
		});

		QUnit.test("showMessage creates and adds the message to the DOM", function (assert) {
			var done = assert.async();
			var showMessageStub = this.stub(BaseContent.prototype, "showMessage");

			showMessageStub.callsFake(function () {
				Core.applyChanges();
				var oContent = this.oCard.getCardContent();
				showMessageStub.wrappedMethod.apply(oContent, arguments); // call the original method
				Core.applyChanges();

				var oMessageContainer = oContent.getAggregation("_messageContainer");
				// Assert
				assert.ok(oMessageContainer.isA("sap.m.VBox"), "Message container should be created and added aggregated");
				assert.ok(oMessageContainer.getItems()[0].isA("sap.m.MessageStrip"), "_messageContainer has 1 message");
				assert.ok(oMessageContainer.getDomRef(), "Message container is added to the DOM");

				done();
			}.bind(this));

			this.oCard.attachManifestApplied(function () {
				// Act
				this.oCard.showMessage();
			}.bind(this));

			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
		});

		QUnit.test("Message container is destroyed when the message is closed", function (assert) {
			var done = assert.async();
			var showMessageStub = this.stub(BaseContent.prototype, "showMessage");

			showMessageStub.callsFake(function () {
				Core.applyChanges();
				var oContent = this.oCard.getCardContent();
				showMessageStub.wrappedMethod.apply(oContent, arguments); // call the original method
				var oMessageContainer = oContent.getAggregation("_messageContainer");
				var oMessageContainerDestroySpy = this.spy(oMessageContainer, "destroy");

				// Act
				oMessageContainer.getItems()[0].fireClose();

				// Assert
				assert.ok(oMessageContainerDestroySpy.called, "Message container should be destroyed");

				done();
			}.bind(this));

			this.oCard.attachManifestApplied(function () {
				// Act
				this.oCard.showMessage();
			}.bind(this));

			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
		});

		QUnit.test("Multiple calls to showMessage - previous messages are destroyed", function (assert) {
			var done = assert.async();
			var showMessageStub = this.stub(BaseContent.prototype, "showMessage");
			var oMessageStripDestroySpy = this.spy(MessageStrip.prototype, "destroy");

			showMessageStub
				.callThrough() // call the original function on 1st and 2nd calls
				.onThirdCall().callsFake(function () {
					Core.applyChanges();
					var oContent = this.oCard.getCardContent();
					showMessageStub.wrappedMethod.apply(oContent, arguments); // call the original method
					var oMessageContainer = oContent.getAggregation("_messageContainer");
					var oMessage = oMessageContainer.getItems()[0];

					assert.strictEqual(oMessageStripDestroySpy.callCount, 2, "The previous messages should be destroyed");
					assert.strictEqual(oMessageContainer.getItems().length, 1, "There is only 1 message");
					assert.strictEqual(oMessage.getType(), "Success", "The last given message type is used");
					assert.strictEqual(oMessage.getText(), "Last message", "The last given message is used");
					done();
				}.bind(this));

			this.oCard.attachManifestApplied(function () {
				// Act
				this.oCard.showMessage();
				this.oCard.showMessage();
				this.oCard.showMessage("Last message", "Success");
			}.bind(this));

			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
		});

		QUnit.module("Default Header", {
			beforeEach: function () {
				this.oCard = new Card({
					width: "400px",
					height: "600px"
				});

				this.oCard.placeAt(DOM_RENDER_LOCATION);
				Core.applyChanges();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("Default Header initialization", function (assert) {

			// Arrange
			var done = assert.async();

			// Act
			this.oCard.attachEvent("_ready", function () {

				Core.applyChanges();

				// Assert
				var oHeader = this.oCard.getAggregation("_header");
				assert.ok(oHeader, "Card should have header.");
				assert.ok(oHeader.getDomRef(), "Card header should be created and rendered.");
				assert.ok(oHeader.getAggregation("_title") && oHeader.getAggregation("_title").getDomRef(), "Card header title should be created and rendered.");
				assert.ok(oHeader.getAggregation("_subtitle") && oHeader.getAggregation("_subtitle").getDomRef(), "Card header subtitle should be created and rendered.");
				assert.ok(oHeader.getAggregation("_avatar") && oHeader.getAggregation("_avatar").getDomRef(), "Card header avatar should be created and rendered.");
				assert.ok(oHeader.getAggregation("_dataTimestamp") && oHeader.getAggregation("_dataTimestamp").getDomRef(), "Card header dataTimestamp should be created and rendered.");


				assert.equal(oHeader.getAggregation("_title").getText(), oManifest_Header["sap.card"].header.title, "Card header title should be correct.");
				assert.equal(oHeader.getAggregation("_subtitle").getText(), oManifest_Header["sap.card"].header.subTitle, "Card header subtitle should be correct.");
				assert.equal(oHeader.getAggregation("_avatar").getSrc(), oManifest_Header["sap.card"].header.icon.src, "Card header icon src should be correct.");
				assert.equal(oHeader.getStatusText(), oManifest_Header["sap.card"].header.status.text, "Card header status should be correct.");
				assert.equal(oHeader.getDataTimestamp(), oManifest_Header["sap.card"].header.dataTimestamp, "Card header dataTimestamp should be correct.");

				done();
			}.bind(this));
			this.oCard.setManifest(oManifest_Header);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();

			// Assert
			assert.notOk(this.oCard.getAggregation("_header"), "Card header should be empty.");
			assert.notOk(this.oCard.getAggregation("_content"), "Card content should be empty.");
		});

		QUnit.test("Default Header Avatar", function (assert) {

			// Arrange
			var done = assert.async();

			// Act
			this.oCard.attachEvent("_ready", function () {

				Core.applyChanges();

				// Assert
				var oHeader = this.oCard.getAggregation("_header");
				assert.notOk(oHeader.getAggregation("_avatar").getSrc(), "Card header icon src should be empty.");
				assert.equal(oHeader.getAggregation("_avatar").getDisplayShape(), "Circle", "Card header icon shape should be 'Circle'.");
				assert.equal(oHeader.getAggregation("_avatar").getInitials(), "AJ", "Card header initials should be 'AJ'.");

				done();
			}.bind(this));
			this.oCard.setManifest(oManifest_AvatarHeader);
		});

		QUnit.test("'backgroundColor' when there is icon src", function (assert) {
			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {
				Core.applyChanges();
				var oAvatar = this.oCard.getAggregation("_header").getAggregation("_avatar");

				// Assert
				assert.strictEqual(oAvatar.getBackgroundColor(), AvatarColor.Transparent, "Background should be 'Transparent' when there is only icon.");

				done();
			}.bind(this));

			this.oCard.setManifest({
				"sap.app": {
					"id": "test.card.backgroundColorWithIconSrc"
				},
				"sap.card": {
					"type": "List",
					"header": {
						"icon": {
							"src": "sap-icon://accept"
						}
					}
				}
			});
		});

		QUnit.test("'backgroundColor' when there are initials", function (assert) {
			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {
				Core.applyChanges();
				var oAvatar = this.oCard.getAggregation("_header").getAggregation("_avatar"),
					sExpected = oAvatar.getMetadata().getPropertyDefaults().backgroundColor;

				// Assert
				assert.strictEqual(oAvatar.getBackgroundColor(), sExpected, "Background should be default value when there are initials.");

				done();
			}.bind(this));

			this.oCard.setManifest({
				"sap.app": {
					"id": "test.card.backgroundColorWithInitials"
				},
				"sap.card": {
					"type": "List",
					"header": {
						"icon": {
							"text": "SI"
						}
					}
				}
			});
		});

		QUnit.test("'statusText' set with binding", function (assert) {
			// Arrange
			var done = assert.async(),
				oManifest = {
					"sap.app": {
						"id": "my.card.test"
					},
					"sap.card": {
						"type": "List",
						"header": {
							"data": {
								"json": {
									"statusText": "2 of 10"
								}
							},
							"status": {
								"text": "{/statusText}"
							}
						}
					}
				};

			this.oCard.attachEvent("_ready", function () {
				Core.applyChanges();
				var oHeader = this.oCard.getCardHeader();

				// Assert
				assert.strictEqual(oHeader.getStatusText(), oManifest["sap.card"].header.data.json.statusText, "Background should be default value when there are initials.");

				done();
			}.bind(this));

			this.oCard.setManifest(oManifest);
		});

		QUnit.module("Numeric Header", {
			beforeEach: function () {
				this.oCard = new Card("somecard", {
					width: "400px",
					height: "600px"
				});

				this.oCard.placeAt(DOM_RENDER_LOCATION);
				Core.applyChanges();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("'statusText' set with binding", function (assert) {
			// Arrange
			var done = assert.async(),
				oManifest = {
					"sap.app": {
						"id": "my.card.test"
					},
					"sap.card": {
						"type": "List",
						"header": {
							"type": "Numeric",
							"data": {
								"json": {
									"statusText": "2 of 10"
								}
							},
							"status": {
								"text": "{/statusText}"
							}
						}
					}
				};

			this.oCard.attachEvent("_ready", function () {
				Core.applyChanges();
				var oHeader = this.oCard.getCardHeader();

				// Assert
				assert.strictEqual(oHeader.getStatusText(),  oManifest["sap.card"].header.data.json.statusText, "Background should be default value when there are initials.");

				done();
			}.bind(this));

			this.oCard.setManifest(oManifest);
		});

		QUnit.test("Numeric Header generic", function (assert) {

			// Arrange
			var done = assert.async();

			// Act
			this.oCard.attachEvent("_ready", function () {

				Core.applyChanges();

				// Assert
				var oHeader = this.oCard.getAggregation("_header");
				assert.ok(oHeader.getDomRef(), "Card Numeric header should be rendered.");

				// Assert properties
				assert.equal(oHeader.getAggregation("_title").getText(), oManifest_NumericHeader["sap.card"].header.title, "Card header title should be correct.");
				assert.equal(oHeader.getAggregation("_subtitle").getText(), oManifest_NumericHeader["sap.card"].header.subTitle, "Card header subtitle should be correct.");
				assert.equal(oHeader.getAggregation("_unitOfMeasurement").getText(), oManifest_NumericHeader["sap.card"].header.unitOfMeasurement, "Card header unitOfMeasurement should be correct.");
				assert.equal(oHeader.getAggregation("_details").getText(), oManifest_NumericHeader["sap.card"].header.details, "Card header details should be correct.");
				assert.equal(oHeader.getDataTimestamp(), oManifest_NumericHeader["sap.card"].header.dataTimestamp, "Card header dataTimestamp should be correct.");

				done();
			}.bind(this));
			this.oCard.setManifest(oManifest_NumericHeader);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("Numeric Header main indicator with json data", function (assert) {

			// Arrange
			var done = assert.async();

			// Act
			this.oCard.attachEvent("_ready", function () {
				var oHeader = this.oCard.getAggregation("_header"),
					oMainIndicator = oHeader.getAggregation("_numericIndicators").getAggregation("_mainIndicator");

				Core.applyChanges();

				// Assert aggregation mainIndicator
				assert.ok(oMainIndicator.getDomRef(), "Card header main indicator aggregation should be set and rendered");
				assert.equal(oMainIndicator.getValue(), oManifest_NumericHeader["sap.card"].header.data.json["n"], "Card header main indicator value should be correct.");
				assert.equal(oMainIndicator.getScale(), oManifest_NumericHeader["sap.card"].header.data.json["u"], "Card header main indicator scale should be correct.");
				assert.equal(oMainIndicator.getIndicator(), oManifest_NumericHeader["sap.card"].header.data.json["trend"], "Card header main indicator indicator should be correct.");
				assert.equal(oMainIndicator.getValueColor(), oManifest_NumericHeader["sap.card"].header.data.json["valueColor"], "Card header main indicator valueColor should be correct.");

				done();
			}.bind(this));
			this.oCard.setManifest(oManifest_NumericHeader);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("Numeric Header main indicator without 'data'", function (assert) {

			// Arrange
			var done = assert.async();

			// Act
			this.oCard.attachEvent("_ready", function () {
				var oHeader = this.oCard.getAggregation("_header"),
					oMainIndicator = oHeader.getAggregation("_numericIndicators").getAggregation("_mainIndicator");

				Core.applyChanges();

				// Assert aggregation _mainIndicator
				assert.ok(oMainIndicator.getDomRef(), "Card header main indicator aggregation should be set and rendered");
				assert.equal(oMainIndicator.getValue(), oManifest_NumericHeader2["sap.card"].header.mainIndicator.number, "Card header main indicator value should be correct.");
				assert.equal(oMainIndicator.getScale(), oManifest_NumericHeader2["sap.card"].header.mainIndicator.unit, "Card header main indicator scale should be correct.");
				assert.equal(oMainIndicator.getIndicator(), oManifest_NumericHeader2["sap.card"].header.mainIndicator.trend, "Card header main indicator indicator should be correct.");
				assert.equal(oMainIndicator.getValueColor(), oManifest_NumericHeader2["sap.card"].header.mainIndicator.state, "Card header main indicator valueColor should be correct.");

				done();
			}.bind(this));
			this.oCard.setManifest(oManifest_NumericHeader2);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("Numeric Header side indicators", function (assert) {

			// Arrange
			var done = assert.async();

			// Act
			this.oCard.attachEvent("_ready", function () {
				var oHeader = this.oCard.getAggregation("_header");

				Core.applyChanges();

				// Assert aggregation sideIndicators
				assert.ok(oHeader.getAggregation("sideIndicators"), "Card header side indicators should be set.");
				assert.equal(oHeader.getAggregation("sideIndicators").length, oManifest_NumericHeader["sap.card"].header.sideIndicators.length, "Card header should have two side indicators.");

				oHeader.getAggregation("sideIndicators").forEach(function (oIndicator, iIndex) {
					var oSideIndicator = oManifest_NumericHeader["sap.card"].header.sideIndicators[iIndex];
					assert.ok(oIndicator.getDomRef(), "Card header sideIndicators one should be rendered.");
					assert.equal(oIndicator.getTitle(), oSideIndicator.title, "Card header side indicator " + iIndex + " title should be correct.");
					assert.equal(oIndicator.getNumber(), oSideIndicator.number, "Card header side indicator " + iIndex + " number should be correct.");
					assert.equal(oIndicator.getUnit(), oSideIndicator.unit, "Card header side indicator " + iIndex + " unit should be correct.");
				});

				done();
			}.bind(this));
			this.oCard.setManifest(oManifest_NumericHeader);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("Numeric Header with no Details and no Indicators (Main and Side)", function (assert) {

			// Arrange
			var done = assert.async();

			// Act
			this.oCard.attachEvent("_ready", function () {
				var oHeader = this.oCard.getAggregation("_header");

				Core.applyChanges();

				// Assert
				assert.notOk(oHeader.getAggregation("_details"), "Card header should have no Details.");
				assert.notOk(oHeader.getAggregation("_numericIndicators").getAggregation("_mainIndicator"), "Card header should have no Main indicators.");
				assert.equal(oHeader.getAggregation("sideIndicators").length, 0, "Card header should have no Side indicators.");

				assert.equal(document.getElementsByClassName("sapFCardHeaderDetails").length, 0, "Card header Details are not rendered.");
				assert.equal(document.getElementsByClassName("sapFCardNumericIndicators").length, 0, "Card header Indicators are not rendered.");
				assert.equal(document.getElementsByClassName("sapFCardNumericIndicatorsMain").length, 0, "Card header Main Indicator is not rendered.");
				assert.equal(document.getElementsByClassName("sapFCardNumericIndicatorsSide").length, 0, "Card header Side Indicator is not rendered.");

				done();
			}.bind(this));
			this.oCard.setManifest(oManifest_NumericHeader_OnlyTitleAndSubtitle);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.module("Card Accessibility", {
			beforeEach: function () {
				this.oRb = Core.getLibraryResourceBundle("sap.f");
				this.oCard = new Card("somecard", {
					width: "400px",
					height: "600px"
				});
				this.oNumericHeaderCard = new Card("numericCard", {
					width: "400px",
					height: "600px"
				});

				this.oCard.placeAt(DOM_RENDER_LOCATION);
				this.oNumericHeaderCard.placeAt(DOM_RENDER_LOCATION);
				Core.applyChanges();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
				this.oNumericHeaderCard.destroy();
				this.oNumericHeaderCard = null;
				this.oRb = null;
			}
		});

		QUnit.test("Generic", function (assert) {

			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {

				Core.applyChanges();

				// Assert
				var oCardDomRef = this.oCard.getDomRef(),
					oHeader = this.oCard.getAggregation("_header"),
					oHeaderDomRef = oHeader.getDomRef(),
					oContentDomRef = document.getElementsByClassName("sapFCardContent")[0],
					sAriaLabelledByIds = this.oCard._ariaText.getId() + " " + oHeader._getTitle().getId() + " " + oHeader._getSubtitle().getId() + " " + oHeader.getId() + "-status" + " " + oHeader.getId() + "-ariaAvatarText";

				// Assert Card Container
				assert.equal(oCardDomRef.getAttribute("role"), "region", "Card container should have a role - region");
				assert.equal(oCardDomRef.getAttribute("aria-labelledby"), this.oCard._getAriaLabelledIds(), "Card container should have aria-lebelledby - pointing to the static text '[Type of Card] Card' id and title id");


				// Assert Card Header
				assert.equal(oHeaderDomRef.getAttribute("role"), "heading", "Card header should have a role - heading");
				assert.equal(oHeaderDomRef.getAttribute("aria-level"), "3", "Card header should have a aria-level - 3");
				assert.equal(oHeaderDomRef.getAttribute("aria-roledescription"), this.oRb.getText("ARIA_ROLEDESCRIPTION_CARD_HEADER"), "Card header should have aria-roledescription - Card Header");
				assert.equal(oHeaderDomRef.getAttribute("aria-labelledby"), sAriaLabelledByIds, "Card header should have aria-lebelledby - pointing to an element describing the card type, title, subtitle, status text and avatar ids if there is one");
				assert.equal(oHeaderDomRef.getAttribute("tabindex"), 0, "Card header should have tabindex=0");

				// Assert Card Content
				assert.equal(oContentDomRef.getAttribute("role"), "group", "Card content should have a role - group");
				assert.equal(oContentDomRef.getAttribute("aria-labelledby"), this.oCard.getId() + "-ariaContentText", "Card container should have aria-labelledby with the correct id");
				assert.equal(this.oCard.getDomRef("ariaContentText").innerText, this.oRb.getText("ARIA_LABEL_CARD_CONTENT"), "ARIA content hidden text should have the correct value");
				done();
			}.bind(this));

			// Act
			this.oCard.setManifest(oManifest_ListCard);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Generic Interactive", function (assert) {

			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {

				Core.applyChanges();

				// Assert
				var oHeader = this.oCard.getAggregation("_header"),
					oHeaderDomRef = oHeader.getDomRef(),
					sAriaLabelledByIds = this.oCard._ariaText.getId() + " " + oHeader._getTitle().getId() + " " + oHeader._getSubtitle().getId() + " " + oHeader.getId() + "-status" + " " + oHeader.getId() + "-ariaAvatarText";

				// Assert Card Header
				assert.equal(oHeaderDomRef.getAttribute("role"), "button", "Card header should have a role - button");
				assert.notOk(oHeaderDomRef.getAttribute("aria-level"), "Card header should not have aria-level");
				assert.equal(oHeaderDomRef.getAttribute("aria-roledescription"), this.oRb.getText("ARIA_ROLEDESCRIPTION_INTERACTIVE_CARD_HEADER"), "Card header should have aria-roledescription - Card Header");
				assert.equal(oHeaderDomRef.getAttribute("aria-labelledby"), sAriaLabelledByIds, "Card container should have aria-lebelledby - pointing to an element describing the card type, title, subtitle, status text and avatar ids if there is one");
				assert.equal(oHeaderDomRef.getAttribute("tabindex"), 0, "Card header should have tabindex=0");
				done();
			}.bind(this));

			// Act
			this.oCard.setManifest(oManifest_AvatarHeader);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Numeric Header", function (assert) {

			// Arrange
			var done = assert.async();

			this.oNumericHeaderCard.attachEvent("_ready", function () {
				var oHeader = this.oNumericHeaderCard.getAggregation("_header");
				oHeader.setStatusText("3 of 5");

				Core.applyChanges();

				var oHeaderDomRef = oHeader.getDomRef(),
					sAriaLabelledByIds = this.oNumericHeaderCard._ariaText.getId() + " " +
										oHeader._getTitle().getId() + " " +
										oHeader._getSubtitle().getId() + " " +
										oHeader.getId() + "-status" + " " +
										oHeader._getUnitOfMeasurement().getId() + " " +
										oHeader.getAggregation("_numericIndicators").getAggregation("_mainIndicator").getId() + " " +
										oHeader._getSideIndicatorIds() + " " +
										oHeader._getDetails().getId();

				assert.equal(oHeaderDomRef.getAttribute("role"), "heading", "Card header should have a role - heading");
				assert.equal(oHeaderDomRef.getAttribute("aria-roledescription"), this.oRb.getText("ARIA_ROLEDESCRIPTION_CARD_HEADER"), "Card header should have aria-roledescription - Card Header");
				assert.equal(oHeaderDomRef.getAttribute("aria-labelledby"), sAriaLabelledByIds, "Card container should have aria-lebelledby - pointing to an element describing the card type, title, subtitle, status text and avatar ids if there is one");
				assert.equal(oHeaderDomRef.getAttribute("tabindex"), 0, "Card header should have tabindex=0");
				done();
			}.bind(this));

			// Act
			this.oNumericHeaderCard.setManifest(oManifest_NumericHeader);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.module("Error handling", {
			beforeEach: function () {
				this.oCard = new Card();
				this.oRb = Core.getLibraryResourceBundle("sap.ui.integration");
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
				this.oRb = null;
			}
		});

		QUnit.test("Handler call", function (assert) {
			// Arrange
			var oLogSpy = sinon.spy(Log, "error"),
				sLogMessage = "Log this error in the console.";

			this.oCard.setManifest(oManifest_ListCard);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();

			// Act
			this.oCard._handleError(sLogMessage);

			// Assert
			assert.ok(oLogSpy.calledOnceWith(sLogMessage), "Provided message should be logged to the console.");

			// Clean up
			oLogSpy.restore();
		});

		QUnit.test("Bad data url", function (assert) {

			// Arrange
			var oSpy = sinon.spy(Card.prototype, "_handleError"),
				done = assert.async();
			this.oCard.attachEvent("_error", function () {

				// Assert
				assert.ok(oSpy.calledOnce, "Should call error handler when manifest is 'null'");

				// Clean up
				oSpy.restore();
				done();
			});

			// Act
			this.oCard.setManifest(oManifest_Bad_Url_List);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("IllustratedMessage should be set by developer", function (assert) {

			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {
					Core.applyChanges();
					var oErrorConfiguration = {
						"noData": {
							"type": "NoEntries",
							"title": "No new products",
							"description": "Please review later",
							"size": "Auto"
						}
					};
					var oFlexBox = this.oCard._getIllustratedMessage(oErrorConfiguration, true),
						oIllustratedMessage = oFlexBox.getItems()[0];

					// Assert
					assert.strictEqual(oIllustratedMessage.getIllustrationType(), IllustratedMessageType.NoEntries, "The message type set by developer is correct");
					assert.strictEqual(oIllustratedMessage.getIllustrationSize(), IllustratedMessageSize.Auto, "The message size set by developer is correct");
					assert.strictEqual(oIllustratedMessage.getTitle(), "No new products", "The message title set by developer is correct");
					assert.strictEqual(oIllustratedMessage.getDescription(), "Please review later", "The message description set by developer is correct");

					// Clean up
					done();
			}.bind(this));
			// Act
			this.oCard.setManifest(oManifest_Bad_Url_List);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("IllustratedMessage should be used for error in List Card", function (assert) {

			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {
				Core.applyChanges();
				var oFlexBox = this.oCard._getIllustratedMessage(),
					oIllustratedMessage = oFlexBox.getItems()[0];
				// Assert
				assert.strictEqual(oIllustratedMessage.getIllustrationType(), IllustratedMessageType.UnableToLoad, "Default message type is used for list");

				// Clean up
				done();
			}.bind(this));
			// Act
			this.oCard.setManifest(oManifest_Bad_Url_List);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("IllustratedMessage should be used for error in no data scenario - List Card", function (assert) {
			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {
				Core.applyChanges();
				var oFlexBox = this.oCard._getIllustratedMessage(undefined, true),
					oIllustratedMessage = oFlexBox.getItems()[0];
				// Assert
				assert.strictEqual(oIllustratedMessage.getIllustrationType(), IllustratedMessageType.NoData, "Illustrated message type should be no data for List Card");
				assert.strictEqual(this.oCard.getCardContent().getItems()[0].getTitle(), this.oRb.getText("CARD_NO_ITEMS_ERROR_LISTS"), "Correct message is displayed");

				// Clean up
				done();
			}.bind(this));
			// Act
			this.oCard.setManifest(oManifest_No_Data_List);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("IllustratedMessage should be used for error in no data scenario - Table Card", function (assert) {
			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {
				Core.applyChanges();
				var oFlexBox = this.oCard._getIllustratedMessage(undefined, true),
					oIllustratedMessage = oFlexBox.getItems()[0];

				// Assert
				assert.strictEqual(oIllustratedMessage.getIllustrationType(), IllustratedMessageType.NoEntries, "Illustrated message type should be no data for Table Card");
				assert.strictEqual(this.oCard.getCardContent().getItems()[0].getTitle(), this.oRb.getText("CARD_NO_ITEMS_ERROR_LISTS"), "Correct message is displayed");

				// Clean up
				done();
			}.bind(this));
			// Act
			this.oCard.setManifest(oManifest_No_Data_Table);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("In a card with no content, the error is rendered in the header", function (assert) {
			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {
				Core.applyChanges();
				var oHeaderDomRef = this.oCard.getCardHeader().getDomRef();

				// Assert
				assert.ok(oHeaderDomRef.querySelector(".sapFCardErrorContent"), "error element is rendered in the header");
				done();
			}.bind(this));

			// Act
			this.oCard.setManifest(oManifest_DefaultHeader_NoContent);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("Error is logged when binding syntax is not 'complex'", function (assert) {
			// Arrange
			var oLogSpy = this.spy(Log, "error");
			this.stub(Utils, "isBindingSyntaxComplex").returns(false);
			this.oCard.setManifest({
				"sap.app": {
					"id": "test.card.bindingSyntax"
				},
				"sap.card": {
					"type": "List",
					"header": {},
					"content": {
						"item": { }
					}
				}
			});

			// Act
			this.oCard.startManifestProcessing(DOM_RENDER_LOCATION);

			// Assert
			assert.ok(
				oLogSpy.calledWith(sinon.match(/^Cannot parse manifest. Complex binding syntax is not enabled.*/)),
				"Error message should be logged"
			);
		});

		QUnit.module("Component Card");

		QUnit.test("Card and component manifests are in the same file", function (assert) {
			testComponentContentCreation(
				oManifest_ComponentCardAllInOne,
				oManifest_ComponentCardAllInOne,
				assert
			);
		});

		QUnit.test("Controller must have access to the card during onInit", function (assert) {

			// Arrange
			var done = assert.async(),
				oCard = new Card();

			oCard.attachEventOnce("_ready", function () {
				Core.applyChanges();

				var oContent = oCard.getCardContent();

				// Assert
				assert.strictEqual(oContent.$().find(".sapMText").text(), "Berlin", "Controller has access to card parameters during onInit.");

				// Clean up
				oCard.destroy();

				done();
			});

			oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/component/cardAccess/manifest.json");
			oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.module("Parameters", {
			beforeEach: function () {

				var oData = {
					"location": {
						"city": "Waldorf",
						"country": "Germany"
					}
				};
				this.oCard = new Card({
					width: "400px",
					height: "600px"
				});

				this.oCardWithParameters = new Card({
					width: "400px",
					height: "600px",
					parameters: oData.location
				});

			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;

				this.oCardWithParameters.destroy();
				this.oCardWithParameters = null;
			}
		});

		QUnit.test("Property is set with correct values", function (assert) {
			// Act
			this.oCard.setParameters({ "city": "Sofia" });

			var oParameters = this.oCardWithParameters.getParameters(),
				oSetterProperties = this.oCard.getParameters();
			// Assert
			assert.strictEqual(oParameters.city, "Waldorf", "Parameter property is set correctly");
			assert.strictEqual(oParameters.country, "Germany", "Parameter property is set correctly");
			assert.strictEqual(oSetterProperties.city, "Sofia", "Parameter property is set correctly");

		});

		QUnit.test("Default Parameters - In manifest only parameters", function (assert) {

			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {

				Core.applyChanges();
				var oListItems = this.oCard.getCardContent()._getList().getItems(),
					oItem = oManifest_ListCard2["sap.card"]["content"]["data"]["json"][0],
					sTitle = oListItems[0].getTitle(),
					sDescription = oListItems[0].getDescription();

				// Assert
				assert.ok(sDescription.indexOf("Vratza") > -1, "Card parameter 'city' should be replaced in rendered html  with 'Vratza'");
				assert.strictEqual(sDescription.match(/Vratza/g).length, 2, "Parameter can occur multiple times and is replaced in every occurrence");
				assert.ok(sDescription.indexOf("Bulgaria") > -1, "Card parameter 'country' should be replaced in rendered html  with 'Bulgaria'");

				assert.ok(sDescription.indexOf("OBJECT_VALUE") > -1, "Object parameters work");
				assert.ok(sDescription.indexOf("ARRAY_VALUE_0") > -1, "Array parameters work for index 0");
				assert.ok(sDescription.indexOf("ARRAY_VALUE_1") > -1, "Array parameters work for index 1");


				assert.ok(sTitle.indexOf(oItem.Name) > -1, "Card title should be rendered with its value");

				done();
			}.bind(this));

			// Act
			this.oCard.setManifest(oManifest_DefaultParameters);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("Overwrite Parameters - Default value from manifest and one overwritten trough property", function (assert) {

			// Arrange
			var done = assert.async();

			// Act
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
			this.oCard.attachEvent("_ready", function () {

				Core.applyChanges();
				var oListItems = this.oCard.getCardContent()._getList().getItems(),
					oParameters = this.oCard.getCombinedParameters();

				// Assert
				assert.ok(oListItems[0].getDescription().indexOf("Sofia") > -1, "Card parameter 'city' should be replaced in rendered html  with 'Sofia'");
				assert.ok(oListItems[0].getDescription().indexOf("Bulgaria") > -1, "Card parameter 'country' should be replaced in rendered html  with 'Bulgaria'");

				assert.strictEqual(oParameters.city, "Sofia", "Card parameter 'city' is correct.");
				assert.strictEqual(oParameters.country, "Bulgaria", "Card parameter 'country' is correct.");

				done();
			}.bind(this));

			// Act
			this.oCard.setParameters({ "city": "Sofia" });
			this.oCard.setManifest(oManifest_DefaultParameters);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("Default Parameters - In manifest and overwrite from property", function (assert) {

			// Arrange
			var done = assert.async(),
				oData = {
					"location": {
						"city": "Waldorf",
						"country": "Germany"
					}
				};
			this.oCard.attachEvent("_ready", function () {

				Core.applyChanges();

				var oListItems = this.oCard.getCardContent()._getList().getItems(),
					oParameters = this.oCard.getCombinedParameters();

				// Assert
				assert.ok(oListItems[0].getDescription().indexOf("Waldorf") > -1, "Card parameter 'city' should be replaced in rendered html with 'Waldorf'");
				assert.ok(oListItems[0].getDescription().indexOf("Germany") > -1, "Card parameter 'country' should be replaced in rendered html  with 'Germany'");

				assert.strictEqual(oParameters.city, "Waldorf", "Card parameter 'city' is correct.");
				assert.strictEqual(oParameters.country, "Germany", "Card parameter 'country' is correct.");

				done();
			}.bind(this));

			// Act
			this.oCard.setParameters(oData.location);
			this.oCard.setManifest(oManifest_DefaultParameters);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("Only parameter property set", function (assert) {

			// Arrange
			var done = assert.async(),
				oData = {
					"location": {
						"city": "Vratza",
						"country": "Bulgaria"
					}
				};
			this.oCard.attachEvent("_ready", function () {

				Core.applyChanges();
				var oListItems = this.oCard.getCardContent()._getList().getItems();
				// Assert
				assert.ok(oListItems[0].getDescription().indexOf("Vratza") === -1, "Card parameter 'city' should NOT  be replaced in rendered html with 'Vratza'");
				assert.ok(oListItems[0].getDescription().indexOf("Bulgaria") === -1, "Card parameter 'country' NOT should be replaced in rendered html  with 'Bulgaria'");

				done();
			}.bind(this));

			// Act
			this.oCard.setParameters(oData.location);
			this.oCard.setManifest(oManifest_WithoutParameters);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("No parameters property set and no manifest parameters", function (assert) {

			// Arrange
			var done = assert.async(),
				fnErrorSpy = sinon.spy(Log, "error");

			this.oCard.attachEvent("_ready", function () {
				Core.applyChanges();
				var sMessage = "If parameters property is set, parameters should be described in the manifest";
				// Assert
				assert.ok(fnErrorSpy.neverCalledWith(sMessage), "There is no error logged if parameters are not set.");

				fnErrorSpy.restore();

				done();
			});

			// Act
			this.oCard.setManifest(oManifest_WithoutParameters);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("Parameters are set after card is rendered once - In manifest and overwrite from property", function (assert) {

			// Arrange
			var done = assert.async(),
				oData = {
					"location": {
						"city": "Waldorf",
						"country": "Germany"
					}
				};

			this.oCard.attachEventOnce("_ready", function () {
				this.oCard.attachEventOnce("_ready", function () {
					Core.applyChanges();

					// Assert
					var oListItems = this.oCard.getCardContent()._getList().getItems();
					assert.ok(oListItems[0].getDescription().indexOf("Waldorf") > -1, "Card parameter 'city' should be replaced in rendered html with 'Waldorf'");
					assert.ok(oListItems[0].getDescription().indexOf("Germany") > -1, "Card parameter 'country' should be replaced in rendered html  with 'Germany'");
					done();
				}.bind(this));

				// Act
				this.oCard.setParameters(oData.location);
			}.bind(this));

			this.oCard.setManifest(oManifest_DefaultParameters);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
			Core.applyChanges();
		});

		QUnit.test("Setting single parameter", function (assert) {

			// Arrange
			var done = assert.async();

			this.oCard.attachEventOnce("_ready", function () {
				this.oCard.attachEventOnce("_ready", function () {
					Core.applyChanges();

					// Assert
					var oListItems = this.oCard.getCardContent()._getList().getItems();
					assert.ok(oListItems[0].getDescription().indexOf("Tokyo") > -1, "Card parameter 'city' should be replaced in rendered html with 'Tokyo'");
					done();
				}.bind(this));

				// Act
				this.oCard.setParameter("city", "Tokyo");
			}.bind(this));

			this.oCard.setManifest(oManifest_DefaultParameters);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Only TODAY_ISO or NOW_ISO are used", function (assert) {

			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {

				Core.applyChanges();

				// Act
				var sSubtitle = this.oCard.getCardHeader()._getSubtitle().getText();
				assert.ok(sSubtitle !== "", "Card should have a subtitle with the now Date");
				done();
			}.bind(this));

			this.oCard.setManifest(oManifest_Today_Parameter);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Only TODAY_ISO and LOCALE are used", function (assert) {

			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {

				Core.applyChanges();

				// Act
				var sSubtitle = this.oCard.getCardHeader()._getSubtitle().getText();
				assert.ok(sSubtitle.indexOf(new Date().toISOString().slice(0, 10)) > -1, "Card should have a subtitle with the now Date");
				assert.ok(sSubtitle.indexOf(Core.getConfiguration().getLocale().toString()) > -1, "Card should have a subtitle with the locale");
				done();
			}.bind(this));

			this.oCard.setManifest(oManifest_Today_And_Location_Parameter);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Allow visibility change based on a parameter of type array", function (assert) {

			// Arrange

			var oManifest = {
				"sap.app": {
					"id": "test.object.card.visibility",
					"type": "card"
				},
				"sap.ui": {
					"technology": "UI5"
				},
				"sap.card": {
					"type": "Object",
					"configuration": {
						"parameters": {
							"visibleFields": {
								"value": ["firstName", "companyDetails"]
							},
							"visibleItems": {
								"value": ["lastName"]
							}
						}
					},
					"content": {
						"groups": [
							{
								"title": "Contact Details",
								"items": [
									{
										"label": "First Name",
										"value": "First Name",
										"visible": "{= ${parameters>/visibleFields/value}.indexOf('firstName')>-1}"
									},
									{
										"label": "Last Name",
										"value": "LastName",
										"visible": "{= ${parameters>/visibleFields/value}.indexOf('lastName')>-1}"
									}
								]
							},
							{
								"title": "Company Details",
								"visible": "{= ${parameters>/visibleFields/value}.indexOf('companyDetails')>-1}",
								"items": [
									{
										"label": "Company Name",
										"value": "Company Name"
									}
								]
							}
						]
					}
				}
			};

			var oSpy = sinon.spy(Log, "warning"),
				done = assert.async(),
				sWarning = "The parameter name 'visibleItems' is reserved for cards. Can not be used for creating custom parameter.";

			this.oCard.attachEvent("_ready", function () {
				var oContent = this.oCard.getAggregation("_content"),
				oLayout = oContent.getAggregation("_content").getItems()[0];

				Core.applyChanges();

				// Assert
				assert.ok(oSpy.calledWith(sWarning), "Warning is logged if reserved parameter name is used");
				oSpy.restore();

				assert.ok(oLayout.getContent()[0].getItems()[1].getVisible(), "The group item should be visible");
				assert.notOk(oLayout.getContent()[0].getItems()[3].getVisible(), "The group item should not be visible");
				assert.ok(oLayout.getContent()[1].getItems()[0].getVisible(), "The group item should not be visible");

				done();
			}.bind(this));

			this.oCard.setManifest(oManifest);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.module("Refreshing", {
			beforeEach: function () {
				this.oCard = new Card();
				this.oManifest = {
					"sap.app": {
						"id": "test.card.refreshing.card1"
					},
					"sap.card": {
						"type": "List",
						"content": {
							"data": {
								"json": [
									{ "Name": "Product 1" },
									{ "Name": "Product 2" },
									{ "Name": "Product 3" }
								]
							},
							"item": {
								"title": "{Name}"
							}
						}
					}
				};
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
				this.oManifest = null;
			}
		});

		QUnit.test("Refreshing card state", function (assert) {

			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {

				Core.applyChanges();

				this.oCard.attachEventOnce("_ready", function () {

					// Assert
					assert.ok(true, "Should have fired _ready event after refresh.");

					// Cleanup
					done();
				});

				// Act
				this.oCard.refresh();
			}.bind(this));

			this.oCard.placeAt(DOM_RENDER_LOCATION);
			this.oCard.setManifest(this.oManifest);
		});

		QUnit.module("Refreshing data", {
			beforeEach: function () {
				this.oCard = new Card();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("Inner level data", function (assert) {
			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {
				var oContentSpy = sinon.spy(BaseContent.prototype, "refreshData"),
					oHeaderSpy = sinon.spy(Header.prototype, "refreshData"),
					oFilterSpy = sinon.spy(Filter.prototype, "refreshData"),
					oDataProviderSpy = sinon.spy(DataProvider.prototype, "triggerDataUpdate");

				Core.applyChanges();
				this.oCard.refreshData();
				assert.ok(oContentSpy.called, "content refreshData method is called");
				assert.ok(oHeaderSpy.called, "header refreshData method is called");
				assert.strictEqual(oFilterSpy.callCount, 2, "filter refreshData method is called twice");
				assert.strictEqual(oDataProviderSpy.callCount, 4, "dataprovider triggerDataUpdate method is called 4 times");

				oContentSpy.restore();
				oHeaderSpy.restore();
				oFilterSpy.restore();
				oDataProviderSpy.restore();
				done();
			}.bind(this));

			this.oCard.placeAt(DOM_RENDER_LOCATION);
			this.oCard.setManifest({
				"sap.app": {
					"id": "test.card.refreshing.card1"
				},
				"sap.card": {
					"configuration": {
						"filters": {
							"f1": {
								"data": {
									"json": [
										{ "Name": "Product 1" }
									]
								}
							},
							"f2": {
								"data": {
									"json": [
										{ "Name": "Product 1" }
									]
								}
							}
						}
					},
					"type": "List",
					"header": {
						"title": "L3 Request list content Card",
						"data": {
							"json": [
								{ "Name": "Product 1" }
							]
						}
					},
					"content": {
						"data": {
							"json": [
								{ "Name": "Product 1" },
								{ "Name": "Product 2" },
								{ "Name": "Product 3" }
							]
						},
						"item": {
							"title": "{Name}"
						}
					}
				}
			});
		});

		QUnit.test("Root(card) level data", function (assert) {
			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {
				var oContentSpy = sinon.spy(BaseContent.prototype, "refreshData"),
					oHeaderSpy = sinon.spy(Header.prototype, "refreshData"),
					oFilterSpy = sinon.spy(Filter.prototype, "refreshData"),
					oDataProviderSpy = sinon.spy(DataProvider.prototype, "triggerDataUpdate");

				Core.applyChanges();
				this.oCard.refreshData();
				assert.ok(oContentSpy.called, "content refreshData method is called");
				assert.ok(oHeaderSpy.called, "header refreshData method is called");
				assert.strictEqual(oFilterSpy.callCount, 2, "filter refreshData method is called twice");
				assert.strictEqual(oDataProviderSpy.callCount, 1, "dataprovider triggerDataUpdate method is called once");

				oContentSpy.restore();
				oHeaderSpy.restore();
				oFilterSpy.restore();
				oDataProviderSpy.restore();
				done();
			}.bind(this));

			this.oCard.placeAt(DOM_RENDER_LOCATION);
			this.oCard.setManifest({
				"sap.app": {
					"id": "test.card.refreshing.card1"
				},
				"sap.card": {
					"data": {
						"json": [
							{ "Name": "Product 1" }
						]
					},
					"configuration": {
						"filters": {
							"f1": {

							},
							"f2": {

							}
						}
					},
					"type": "List",
					"header": {
						"title": "L3 Request list content Card"
					},
					"content": {
						"item": {
							"title": "{Name}"
						}
					}
				}
			});
		});

		QUnit.test("No data", function (assert) {
			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {
				var oContentSpy = sinon.spy(BaseContent.prototype, "refreshData"),
					oHeaderSpy = sinon.spy(Header.prototype, "refreshData"),
					oFilterSpy = sinon.spy(Filter.prototype, "refreshData"),
					oDataProviderSpy = sinon.spy(DataProvider.prototype, "triggerDataUpdate");

				Core.applyChanges();
				this.oCard.refreshData();
				assert.ok(oContentSpy.called, "content refreshData method is called");
				assert.ok(oHeaderSpy.called, "header refreshData method is called");
				assert.strictEqual(oFilterSpy.callCount, 2, "filter refreshData method is called twice");
				assert.ok(oDataProviderSpy.notCalled, "dataprovider triggerDataUpdate method is not called");

				oContentSpy.restore();
				oHeaderSpy.restore();
				oFilterSpy.restore();
				oDataProviderSpy.restore();
				done();
			}.bind(this));

			this.oCard.placeAt(DOM_RENDER_LOCATION);
			this.oCard.setManifest({
				"sap.app": {
					"id": "test.card.refreshing.card1"
				},
				"sap.card": {
					"configuration": {
						"filters": {
							"f1": {

							},
							"f2": {

							}
						}
					},
					"type": "List",
					"header": {
						"title": "L3 Request list content Card"
					},
					"content": {
						"item": {
							"title": "{Name}"
						}
					}
				}
			});
		});

		QUnit.module("Refreshing data - invalid response", {
			beforeEach: function () {
				this.oServer = sinon.fakeServer.create();
				this.oServer.autoRespond = true;
				this.oServer.xhr.useFilters = true;
				this.oServer.xhr.addFilter(function (method, url) {
					return !url.startsWith("/GetSales");
				});

				this.bError = true;

				// Endpoints
				this.oServer.respondWith("/GetSalesSuccess", function (xhr) {

					var iResult = 500;
					var mResponseJSON = "";

					if (!this.bError) {
						iResult = 200;
						mResponseJSON = {items: [{title: "Title 1"}]};
					}

					this.bError = !this.bError;

					xhr.respond(iResult, {"Content-Type": "application/json"}, JSON.stringify(mResponseJSON));
				}.bind(this));

				this.oCard = new Card();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;

				this.oServer.reset();
				this.oServer = null;
			}
		});

		QUnit.test("Initially invalid response, valid second response", function (assert) {
			// Arrange
			var done = assert.async(2);
			this.oCard.attachEventOnce("_ready", function () {
				Core.applyChanges();

				var oContent = this.oCard.getCardContent();
				assert.notOk(oContent.isA("sap.ui.integration.cards.BaseContent"), "Error is displayed.");

				this.oCard.refreshData();

				this.oCard.attachEventOnce("_contentReady", function () {
					Core.applyChanges();

					var oContent = this.oCard.getCardContent();
					assert.ok(oContent.isA("sap.ui.integration.cards.BaseContent"), "Content is displayed correctly.");

					done();
				}.bind(this));

				done();
			}.bind(this));

			this.oCard.placeAt(DOM_RENDER_LOCATION);
			this.oCard.setManifest({
				"sap.app": {
					"id": "test.card.refreshing.card1"
				},
				"sap.card": {
					"type": "List",
					"header": {
						"title": "Sales Report"
					},
					"content": {
						"data": {
							"request": {
								"url": "/GetSalesSuccess"
							},
							"path": "/items"
						},
						"item": {
							"title": "{title}"
						},
						"maxItems": "5"
					}
				}
			});
		});

		QUnit.module("Data mode", {
			beforeEach: function () {
				this.oCard = new Card();
				this.oManifest = {
					"sap.app": {
						"id": "test.card.dataMode.card1"
					},
					"sap.card": {
						"type": "List",
						"content": {
							"data": {
								"json": [
									{ "Name": "Product 1" },
									{ "Name": "Product 2" },
									{ "Name": "Product 3" }
								]
							},
							"item": {
								"title": "{Name}"
							}
						}
					}
				};
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
				this.oManifest = null;
			}
		});

		QUnit.test("Set data mode", function (assert) {

			// Arrange
			var done = assert.async(),
				oApplyManifestSpy = sinon.spy(Card.prototype, "_applyManifestSettings"),
				oRefreshSpy = sinon.spy(Card.prototype, "refresh");

			this.oCard.attachEventOnce("_ready", function () {

				// Assert
				assert.ok(oApplyManifestSpy.calledOnce, "Card with default 'Active' state should try to apply the manifest settings.");

				// Act
				oApplyManifestSpy.reset();
				this.oCard.setDataMode("Inactive");

				// Assert
				assert.ok(oApplyManifestSpy.notCalled, "Card with 'Inactive' state should NOT try to apply the manifest settings.");

				// Act
				this.oCard.setDataMode("Active");

				// Assert
				assert.ok(oRefreshSpy.calledOnce, "Should call refresh when turning to 'Active' mode.");

				// Cleanup
				oApplyManifestSpy.restore();
				done();

			}.bind(this));

			this.oCard.setManifest(this.oManifest);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.module("Card manifest - URL", {
			beforeEach: function () {
				this.oCardUrl = new Card({
					width: "400px",
					height: "600px"
				});
			},
			afterEach: function () {
				this.oCardUrl.destroy();
				this.oCardUrl = null;
			}
		});

		QUnit.test("Card manifest set trough url", function (assert) {

			// Arrange
			var done = assert.async();
			this.oCardUrl.attachEventOnce("_ready", function () {

				Core.applyChanges();

				// Assert
				assert.ok(true, "Should have fired _ready event.");

				// Cleanup
				done();
			});

			this.oCardUrl.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			this.oCardUrl.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.module("Header counter", {
			beforeEach: function () {
				this.oCard = new Card({
					width: "400px",
					height: "600px"
				});
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("Formatting with self translation", function (assert) {

			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {

				Core.applyChanges();

				var oHeader = this.oCard.getCardHeader();

				// Assert
				assert.equal(oHeader.getStatusText(), "2 of 115", "Should have correctly formatted and translated counter.");

				// Cleanup
				done();
			}.bind(this));

			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/testResources/cardWithTranslationsOwnCounter/manifest.json");
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Formatting with custom translation", function (assert) {

			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {

				Core.applyChanges();

				var oHeader = this.oCard.getCardHeader();

				// Assert
				assert.equal(oHeader.getStatusText(), "2 of custom 115", "Should have correctly formatted and translated counter.");

				// Cleanup
				done();
			}.bind(this));

			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/testResources/cardWithTranslationsCustomCounter/manifest.json");
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Formatting with self translation and no custom translation", function (assert) {

			// Arrange
			var done = assert.async();
			this.oCard.attachEventOnce("_ready", function () {

				Core.applyChanges();

				var oHeader = this.oCard.getCardHeader();

				// Assert
				assert.equal(oHeader.getStatusText(), "2 of 115", "Should have correctly formatted and translated counter.");

				// Cleanup
				done();
			}.bind(this));

			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/testResources/cardWithTranslationsOwnCounter/manifest.json");
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.module("Events", {
			beforeEach: function () {
				this.oCard = new Card();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("'manifestReady' event is fired.", function (assert) {

			// Arrange
			var done = assert.async();
			this.oCard.attachManifestReady(function () {
				// Assert
				assert.ok(true, "Should have fired 'manifestReady' event.");
				done();
			});

			// Act
			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("getManifestEntry after 'manifestReady' event is fired.", function (assert) {

			// Arrange
			var done = assert.async();
			this.oCard.attachManifestReady(function () {
				// Assert
				assert.deepEqual(this.oCard.getManifestEntry("/"), oManifest_ListCard, "getManifestEntry returns correct result for '/'");
				assert.deepEqual(this.oCard.getManifestEntry("/sap.card"), oManifest_ListCard["sap.card"], "getManifestEntry returns correct result for '/sap.card'");
				assert.strictEqual(this.oCard.getManifestEntry("/sap.card/header/title"), oManifest_ListCard["sap.card"]["header"]["title"], "getManifestEntry returns correct result for '/sap.card/header/title'");
				done();
			}.bind(this));

			// Act
			this.oCard.setManifest(oManifest_ListCard);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("'manifestApplied' event is fired.", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = this.oCard;

				oCard.attachManifestApplied(function () {
				// Assert
				assert.ok(true, "Event 'manifestApplied' is fired.");
				done();
			});

			// Act
			oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.module("Property 'manifestChanges'", {
			beforeEach: function () {
				this.oCard = new Card();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("Change title with manifestChanges", function (assert) {
			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {
				// Assert
				assert.strictEqual(this.oCard.getAggregation("_header").getTitle(), "My new title 2", "The title is changed");
				done();
			}.bind(this));

			// Act
			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			this.oCard.setManifestChanges([
				{ content: { header: { title: "My new title 1" } } },
				{ content: { header: { title: "My new title 2" } } }
			]);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Change title with manifestChanges with path syntax", function (assert) {
			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {
				// Assert
				assert.strictEqual(this.oCard.getAggregation("_header").getTitle(), "My new title 2", "The title is changed");
				done();
			}.bind(this));

			// Act
			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			this.oCard.setManifestChanges([
				{ "/sap.card/header/title": "My new title 1" },
				{ "/sap.card/header/title": "My new title 2" }

			]);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Change title with manifestChanges with mixed syntax, last path syntax", function (assert) {
			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {
				// Assert
				assert.strictEqual(this.oCard.getAggregation("_header").getTitle(), "My new title 4", "The title is changed");
				done();
			}.bind(this));

			// Act
			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			this.oCard.setManifestChanges([
				{ "/sap.card/header/title": "My new title 1" },
				{ content: { header: { title: "My new title 2" } } },
				{ content: { header: { title: "My new title 3" } } },
				{ "/sap.card/header/title": "My new title 4" }
			]);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Change title with manifestChanges with mixed syntax, last content syntax", function (assert) {
			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {
				// Assert
				assert.strictEqual(this.oCard.getAggregation("_header").getTitle(), "My new title 4", "The title is changed");
				done();
			}.bind(this));

			// Act
			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			this.oCard.setManifestChanges([
				{ "/sap.card/header/title": "My new title 1" },
				{ content: { header: { title: "My new title 2" } } },
				{ "/sap.card/header/title": "My new title 3" },
				{ content: { header: { title: "My new title 4" } } }
			]);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Check getManifestWithMergedChanges", function (assert) {
			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {
				// Assert
				var oMergedManifest = this.oCard.getManifestWithMergedChanges();
				assert.strictEqual(oMergedManifest["sap.card"]["header"]["title"], "Test title", "The manifest contains the given changes.");
				done();
			}.bind(this));

			// Act
			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			this.oCard.setManifestChanges([
				{ content: { header: { title: "Test title" } } }
			]);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.test("Check getManifestWithMergedChanges with path syntax", function (assert) {
			// Arrange
			var done = assert.async();

			this.oCard.attachEvent("_ready", function () {
				// Assert
				var oMergedManifest = this.oCard.getManifestWithMergedChanges();
				assert.strictEqual(oMergedManifest["sap.card"]["header"]["title"], "Test title", "The manifest contains the given changes.");
				done();
			}.bind(this));

			// Act
			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			this.oCard.setManifestChanges([
				{ "/sap.card/header/title": "Test title" }
			]);
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.module("Style classes", {
			beforeEach: function () {
				this.oCard = new Card({
					width: "400px",
					height: "600px"
				});

				this.oCard.placeAt(DOM_RENDER_LOCATION);
				Core.applyChanges();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("'sapUiIntCardAnalytical' is added only when the type is 'Analytical'", function (assert) {
			// Arrange
			var done = assert.async(),
				oAnalyticalManifest = {
					"sap.app": {
						"id": "someId"
					},
					"sap.card": {
						"type": "Analytical"
					}
				},
				oTableManifest = {
					"sap.app": {
						"id": "someId"
					},
					"sap.card": {
						"type": "Table"
					}
				};

			// Act
			this.oCard.attachEventOnce("_ready", function () {
				// Assert
				assert.ok(this.oCard.$().hasClass("sapUiIntCardAnalytical"), "'sapUiIntCardAnalytical' class should be set.");

				this.oCard.attachEventOnce("_ready", function () {
					// Assert
					assert.notOk(this.oCard.$().hasClass("sapUiIntCardAnalytical"), "'sapUiIntCardAnalytical' class should NOT be set.");
					done();
				}.bind(this));

				// Act
				this.oCard.setManifest(oTableManifest);

			}.bind(this));

			this.oCard.setManifest(oAnalyticalManifest);
		});


		QUnit.module("Badge", {
			beforeEach: function () {
				this.oCard = new Card({
					customData: [
						new BadgeCustomData({
							value: "New"
						})
					],
					width: "400px",
					height: "600px"
				});
			},
			afterEach: function () {
				// this.sinon.useFakeTimers = false;
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("Rendering", function (assert) {
			var done = assert.async();

			// Arrange
			this.oCard.attachEventOnce("_ready", function () {

				Core.applyChanges();

				var $badgeIndicator = this.oCard.$().find(".sapMBadgeIndicator");

				// Assert
				assert.strictEqual(this.oCard.$().find(".sapMBadgeIndicator").attr("data-badge"), "New", "Badge indicator is correctly rendered");
				assert.strictEqual($badgeIndicator.attr("aria-label"), "New", "Badge aria-label correctly rendered");
				assert.ok(this.oCard.getCardHeader().$().attr("aria-labelledby").indexOf($badgeIndicator.attr('id')) > -1, "aria-labelledby contains the badge indicator id");

				done();

			}.bind(this));

			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});


		QUnit.test("Auto hide", function (assert) {
			var done = assert.async();

			// Arrange
			this.oCard.attachEventOnce("_ready", function () {

				Core.applyChanges();

				this.clock = sinon.useFakeTimers();

				var $badgeIndicator = this.oCard.$().find(".sapMBadgeIndicator");

				// Assert
				assert.ok(this.oCard.$().find(".sapMBadgeIndicator").attr("data-badge"), "Badge indicator is rendered");

				this.oCard.focus();

				this.clock.tick(4000);

				assert.equal(this.oCard._isBadgeAttached, false, "Badge indicator is not rendered");
				assert.notOk($badgeIndicator.attr("aria-label"), "Badge aria-label is removed");
				assert.ok(this.oCard.getCardHeader().$().attr("aria-labelledby").indexOf($badgeIndicator.attr('id')) === -1, "aria-labelledby does not contain the badge indicator id");

				this.oCard.addCustomData(new BadgeCustomData({value: "New"}));
				Core.applyChanges();

				$badgeIndicator = this.oCard.$().find(".sapMBadgeIndicator");

				// Assert
				assert.ok(this.oCard.$().find(".sapMBadgeIndicator").attr("data-badge"), "Badge indicator is rendered");

				this.oCard.onsapenter();
				assert.equal(this.oCard._isBadgeAttached, false, "Badge indicator is not rendered");

				this.clock.restore();
				done();

			}.bind(this));

			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/manifests/manifest.json");
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		});


		QUnit.module("Translations", {
			beforeEach: function () {
				this.oCard = new Card();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("Use getTranslatedText", function (assert) {

			var done = assert.async(),
				oCard = this.oCard;

			// Arrange
			oCard.attachEventOnce("_ready", function () {
				Core.applyChanges();

				// Assert
				assert.strictEqual(oCard.getTranslatedText("SUBTITLE"), "Some subtitle", "The translation for SUBTITLE is correct.");
				assert.strictEqual(oCard.getTranslatedText("COUNT_X_OF_Y", [3, 5]), "3 of custom 5", "The translation for COUNT_X_OF_Y is correct.");

				done();
			});

			oCard.setManifest("test-resources/sap/ui/integration/qunit/testResources/cardWithTranslationsCustomCounter/manifest.json");
			oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.module("Size", {
			beforeEach: function () {
				this.oCard = new Card();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("Content height is not bigger than container height", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = this.oCard;

			oCard.setWidth("400px");
			oCard.setHeight("200px");

			oCard.attachEvent("_ready", function () {
				Core.applyChanges();

				var oContent = oCard.getCardContent(),
					iHeight = oContent.getDomRef().getBoundingClientRect().height;

				// Assert
				assert.ok(iHeight < 200, "The height of the content is not larger than the height of the container.");

				done();
			});

			// Act
			oCard.setManifest(oManifest_ListCard);
			oCard.placeAt(DOM_RENDER_LOCATION);
		});

		QUnit.module("Card without rendering", {
			beforeEach: function () {
				this.oCard = new Card();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("Full manifest processing is done by calling the method 'startManifestProcessing'", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = this.oCard;

			oCard.attachEvent("_ready", function () {
				var aItems = this.oCard.getCardContent().getInnerList().getItems();

				// Assert
				assert.ok(true, "Card processing was done even without rendering.");
				assert.strictEqual(aItems.length, 8, "The content has 8 items in its aggregation.");
				done();
			}.bind(this));

			// Act
			oCard.setManifest(oManifest_ListCard);
			oCard.startManifestProcessing();
		});

		QUnit.module("Destroy", {
			beforeEach: function () {
				this.oCard = new Card({
					width: "400px",
					height: "600px"
				});
				this.oCard.placeAt(DOM_RENDER_LOCATION);
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("Destroy card while manifest is loading", function (assert) {
			// Arrange
			var oSpy = sinon.spy(Card.prototype, "_registerManifestModulePath"),
				done = assert.async();

			this.oCard.setManifest("test-resources/sap/ui/integration/qunit/testResources/listCard.manifest.json");
			Core.applyChanges();

			assert.ok(this.oCard._oCardManifest, "There is Manifest instance");

			// Act
			this.oCard.destroy();

			setTimeout(function () {
				// Assert
				assert.ok(oSpy.notCalled, "Method is not called if the card is destroyed");

				oSpy.restore();
				done();
			}, 500);
		});

		QUnit.module("Custom Models", {
			beforeEach: function () {
				this.oCard = new Card();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("List items can be set through custom model", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = this.oCard;

			oCard.attachEvent("_ready", function () {
				var aItems;

				oCard.getModel("cities").setData({
					items: [
						{name: "City 1"},
						{name: "City 2"}
					]
				});

				Core.applyChanges();

				aItems = this.oCard.getCardContent().getInnerList().getItems();

				// Assert
				assert.strictEqual(aItems.length, 2, "There are two items rendered from the custom model.");
				done();
			}.bind(this));

			// Act
			oCard.setManifest(oManifest_CustomModels);
			oCard.startManifestProcessing();
		});

		QUnit.test("Registering custom models on multiple calls to setManifest", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = this.oCard,
				fnErrorLogSpy = sinon.spy(Log, "error");

			oCard.attachEventOnce("_ready", function () {
				var fnModelDestroySpy = sinon.spy(oCard.getModel("cities"), "destroy");

				oCard.attachEventOnce("_ready", function () {
					// Assert - after second setManifest
					assert.ok(fnModelDestroySpy.calledOnce, "Destroy was called for the custom model on second setManifest.");
					assert.strictEqual(this._aCustomModels.length, 1, "Custom model is registered only once.");
					assert.notOk(fnErrorLogSpy.called, "There is no error logged for duplicate custom model names.");

					oCard.destroy();
					Core.applyChanges();

					assert.ok(true, "Card can be successfully destroyed after multiple calls to setManifest.");

					done();

					// Clean up
					fnModelDestroySpy.restore();
					fnErrorLogSpy.restore();
				});

				// Act
				oCard.setManifest(oManifest_CustomModels);
				oCard.startManifestProcessing();
				Core.applyChanges();

			});

			// Act
			oCard.setManifest(oManifest_CustomModels);
			oCard.startManifestProcessing();
		});

		QUnit.module("Grouping", {
			beforeEach: function () {
				this.oCard = new Card();
			},
			afterEach: function () {
				this.oCard.destroy();
				this.oCard = null;
			}
		});

		QUnit.test("List card items can be grouped", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = this.oCard;

			oCard.attachEvent("_ready", function () {
				var aItems = this.oCard.getCardContent().getInnerList().getItems();
				// Assert
				assert.strictEqual(aItems.length, 4, "There are two list items and two group titles in the list.");
				assert.ok(aItems[0].isA("sap.m.GroupHeaderListItem"), "The first item of the list is the group title");
				assert.strictEqual(aItems[0].getTitle(), "Expensive", "The group title is correct");
				done();
			}.bind(this));

			// Act
			oCard.setManifest({
				"sap.app": {
					"id": "test.card.listGrouping.card"
				},
				"sap.card": {
					"type": "List",
					"header": {
						"title": "List Card"
					},
					"content": {
						"data": {
							"json": [{
									"Name": "Product 1",
									"Price": "100"
								},
								{
									"Name": "Product 2",
									"Price": "200"
								}
							]
						},
						"item": {
							"title": "{Name}",
							"description": "{Price}"
						},
						"group": {
							"title": "{= ${Price} > 150 ? 'Expensive' : 'Cheap'}",
							"order": {
								"path": "Price",
								"dir": "DESC"
							}
						}
					}
				}
			});
			oCard.startManifestProcessing();
		});

		QUnit.test("Table card items can be grouped", function (assert) {
			// Arrange
			var done = assert.async(),
				oCard = this.oCard;

			oCard.attachEvent("_ready", function () {
				var aItems = this.oCard.getCardContent().getInnerList().getItems();
				// Assert
				assert.strictEqual(aItems.length, 4, "There are two list items and two group titles in the list.");
				assert.ok(aItems[0].isA("sap.m.GroupHeaderListItem"), "The first item of the list is the group title");
				assert.strictEqual(aItems[0].getTitle(), "Cheap", "The group title is correct");
				done();
			}.bind(this));

			// Act
			oCard.setManifest({
				"sap.app": {
					"id": "test.card.tableGrouping.card"
				},
				"sap.card": {
					"type": "Table",
					"data": {
						"json":[{
							"Name": "Product 1",
							"Price": "100"
						},
						{
							"Name": "Product 2",
							"Price": "200"
						}
					]
					},
					"header": {
						"title": "L3 Request list content Card"
					},
					"content": {
						"row": {
							"columns": [{
									"title": "Name",
									"value": "{Name}"
								},
								{
									"title": "Price",
									"value": "{Price}"
								}
							]
						},
						"group": {
							"title": "{= ${Price} > 150 ? 'Expensive' : 'Cheap'}",
							"order": {
								"path": "Price",
								"dir": "ASC"
							}
						}
					}
				}
			});
			oCard.startManifestProcessing();
		});
	}
);
