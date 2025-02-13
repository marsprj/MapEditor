// 图层样式对话框
MapCloud.StyleManagerDialog = MapCloud.Class(MapCloud.Dialog,{
	
	// 当前样式名称 
	styleNameCur 		: null, 

	//当前样式
	styleCur 			: null, 

	// 默认样式
	defaultStyle 		: null,

	// // 选中的样式
	// selectedRuleIndex 	: null,

	// isStyleChanged 		: false, //当前样式是否已经更改
	
	// // 是否是默认样式
	// isDefaultStyle 		: false,
	

	wfsWorkspace 		: null,

	// 图层的名称
	typeName 			: null,

	// 唯一值
	uniqueValues 		: null,
	
	dbLayer 			: null,

	// 每个panel有一个style
	singleStyle 		: null,
	uniqueStyle 		: null,
	quantitiesStyle 	: null,

	// 弹出style对话框的style
	styleChangedClass 	: null,
	styleChangedIndex	: null,

	// 弹出的symbol对话框
	symbolChangedClass : null,
	symbolChangedIndex : null,

	// 最大最小值
	minMaxValue 		: null,

	// 自定义样式
	customStyle 		: null,
	customStyleFilters 	: null,

	// 点密度样式
	dotDensityStyle 	: null,

	initialize : function(id){
		MapCloud.Dialog.prototype.initialize.apply(this, arguments);
		var dialog = this;


		//确定
		this.panel.find(".btn-confirm").each(function(){
			$(this).click(function(){
				var name = dialog.panel.find("#style_list option:selected").text(); 
				var currentStyle = dialog.getCurrentStyle();
				if(currentStyle == null){
					MapCloud.notify.showInfo("Warning","请设置一个有效样式");
					return;
				}
				currentStyle.name = name;
				// 是否是WFS图层的默认样式
				if(name != "default"){ 
					var style = styleManager.getStyle(name);
					if(style == null){
						//添加
						dialog.addStyle(currentStyle);
						dialog.setLayerStyleFlag = true;
						dialog.closeDialog();
						return;
					}else{
						// 更新
						dialog.updateStyle(currentStyle);
						if(dialog.typeName != null){
							// 给当前图层设定样式
							dialog.setStyle(dialog.typeName,currentStyle,dialog.setStyle_callback);
						}
						dialog.closeDialog();
						return;		
					}
				}
				if(dialog.typeName != null){
					// 给当前图层设定样式
					dialog.setStyle(dialog.typeName,currentStyle,dialog.setStyle_callback);
				}
				dialog.closeDialog();
			});
		});

		//应用
		this.panel.find(".btn-success").each(function(){
			$(this).click(function(){
				var name = dialog.panel.find("#style_list option:selected").text(); 
				var currentStyle = dialog.getCurrentStyle();
				if(currentStyle == null){
					MapCloud.notify.showInfo("Warning","请设置一个有效样式");
					return;
				}
				currentStyle.name = name;
					// 是否是WFS图层的默认样式
				if(name != "default"){ 
					var style = styleManager.getStyle(name);
					if(style == null){
						//添加
						dialog.addStyle(currentStyle);
						dialog.setLayerStyleFlag = true;
						return;
					}else{
						// 更新
						dialog.updateStyle(currentStyle);
						if(dialog.typeName != null){
							// 给当前图层设定样式
							dialog.setStyle(dialog.typeName,currentStyle,dialog.setStyle_callback);
						}
						return;		
					}
				}
				if(dialog.typeName != null){
					// 给当前图层设定样式
					dialog.setStyle(dialog.typeName,currentStyle,dialog.setStyle_callback);
				}
			});
		});

		// 注册单一样式的点击事件
		this.registerSingleSymbolEvent();
		// 点密度样式的点击事件
		this.registerDotDensitySymbolEvent();
		
		//切换样式类型
		this.panel.find("#style_type_list li a").each(function(){
			$(this).click(function(){
				var value = $(this).text();
				var html = value + "<span class='caret'></span>";
				dialog.panel.find("#style_type_name").html(html);


				value = value.toLowerCase();
				if(value == "all"){
					var styles = styleManager.getStyles();
					dialog.getStyles_callback(styles);
				}else{
					// 点线面类型
					var type = dialog.getStyleType(value);
					if(type != null){
						var styles = styleManager.getStyleByType(type);
						dialog.getStyles_callback(styles);
					}
				}
			});
		});	

		// 切换样式
		this.panel.find("#style_list").each(function(){
			$(this).focus(function(){
				preStyleName = this.value;
			}).change(function(){
				if(this.value == "default" 
					&& dialog.wfsLayer != null){
					var style = dialog.wfsLayer.style;
					dialog.styleNameCur = "default";
					dialog.getStyleXML_callback(style);
					return;
				}

				var selected = $(this).children(":selected");
				var name = selected.text();
				var style = styleManager.getStyle(name);
				if(style != null){
					MapCloud.notify.loading();
					styleManager.getStyleXML(name,dialog.getStyleXML_callback);
				}
			});
		});

		// 新建样式
		this.panel.find("#add_style").each(function(){
			$(this).click(function(){
				var type = dialog.panel.find("#style_type_name").text();
				if(type == "All"){
					MapCloud.notify.showInfo("请选择一个类型","Warning");
					return;
				}
				// 弹出新建样式对话框
				MapCloud.styleName_dialog.setFlag("add");
				MapCloud.styleName_dialog.showDialog();
			});
		});

		//保存样式
		this.panel.find("#save_style").each(function(){
			$(this).click(function(){
				// var name = dialog.styleNameCur;
				var styleName = dialog.panel.find("#style_list option:selected").val();
				var currentStyle = dialog.getCurrentStyle();
				if(currentStyle == null){
					MapCloud.notify.showInfo("Warning","请设置一个有效样式");
					return;
				}
				currentStyle.name = styleName;
				if(styleName == "default"){
					MapCloud.styleName_dialog.setFlag("save");
					MapCloud.styleName_dialog.showDialog();					
					return;
				}else{
					var style = styleManager.getStyle(styleName);
					if(style == null){
						// 添加样式
						dialog.addStyle(currentStyle);
					}else{
						// 更新样式
						dialog.updateStyle(currentStyle);
					}
				}
			});
		});

		//删除样式
		this.panel.find("#remove_style").each(function(){
			$(this).click(function(){
				var name = dialog.panel.find("#style_list option:selected").text();
				var result = confirm("确认删除" + name + "样式？");
				if(result){
					MapCloud.notify.loading();
					dialog.currentStyle = null;
					dialog.singleStyle = null;
					dialog.quantitiesStyle = null;
					dialog.uniqueStyle = null;
					dialog.dotDensityStyle = null;
					styleManager.removeStyle(name,dialog.removeStyle_callback);
				}
			});
		});

		// 添加所有值
		this.panel.find("#add_all_value").each(function(){
			$(this).click(function(){
				var field = dialog.panel.find(".unique-pane .layer-fields option:selected").val();
				if(field == null){
					return;
				}
				// 获取所有值
				dialog.wfsWorkspace.getValue(dialog.typeName,field,
					mapObj.name,
					dialog.getValuesCallback);
			});
		});

		//删除一个rule 
		this.panel.find("#remove_value").each(function(){
			$(this).click(function(){
				var table = dialog.panel.find(".unique-pane .style-list-table");
				var ruleSelected = table.find("tbody tr.selected");
				var rulesTr = table.find("tbody tr");
				var index = rulesTr.index(ruleSelected);
				if(index != -1){
					if(!confirm("确定删除该行样式吗？")){
						return;
					}
					dialog.uniqueStyle.removeRule(index);
					dialog.displayUniqueStyle(dialog.uniqueStyle);
				}
			});
		});

		// 删除所有值
		this.panel.find("#remove_all_value").each(function(){
			$(this).click(function(){
				dialog.uniqueStyle = null;
				dialog.cleanupUniquePanel();
			});
		});

		// 分级样式的字段
		this.panel.find(".quantities-pane .layer-fields").change(function(){
			var field = $(this).find("option:selected").val();
			if(field == "none"){
				dialog.quantitiesStyle = null;
				dialog.cleanupQuantitiesPanel();
			}else{
				if(dialog.wfsWorkspace == null){
					return;
				}
				dialog.wfsWorkspace.getMinMaxValue(dialog.typeName,
					field, mapObj.name,dialog.getMinMaxValue_callback)
			}
		});

		// 分级样式的分级数
		this.panel.find(".quantities-pane .classes").each(function(){
			$(this).change(function(){
				var count = $(this).val();
				var field = dialog.panel.find(".quantities-pane .layer-fields option:selected").val();
				if(field == null || field == "none"){	
					return;
				}
				var id = dialog.panel.find(".quantities-pane .select-color-ramp li").attr("cid");
				if(dialog.minMaxValue == null){
					dialog.wfsWorkspace.getMinMaxValue(dialog.typeName,
						field, mapObj.name,dialog.getMinMaxValue_callback);
				}else{
					// var count = dialog.panel.find(".quantities-pane .classes option:selected").val();
					styleManager.getColorMap(id,count,
						dialog.getColorMapMinMax_callback);
				}

			});
		});

		// 分级样式的添加所有值
		this.panel.find("#quantities_add_all_value").click(function(){
			var field = dialog.panel.find(".quantities-pane .layer-fields").val();
			if(field == "none"){
				dialog.quantitiesStyle = null;
				dialog.cleanupQuantitiesPanel();
			}else{
				if(dialog.wfsWorkspace == null){
					return;
				}
				dialog.wfsWorkspace.getMinMaxValue(dialog.typeName,
					field, mapObj.name,dialog.getMinMaxValue_callback)
			}
		});

		// 删除一个rule
		this.panel.find("#quantities_remove_value").click(function(){
			var table = dialog.panel.find(".quantities-pane .style-list-table");
				var ruleSelected = table.find("tbody tr.selected");
				var rulesTr = table.find("tbody tr");
				var index = rulesTr.index(ruleSelected);
				if(index != -1){
					if(!confirm("确定删除该行样式吗？")){
						return;
					}
					dialog.quantitiesStyle.removeRule(index);
					dialog.displayQuantitiesStyle(dialog.quantitiesStyle);
				}
		});

		// 删除分级样式的所有值
		this.panel.find("#quantities_remove_all_value").click(function(){
			dialog.quantitiesStyle = null;
			dialog.cleanupQuantitiesPanel();
		});

		// 自定义添加
		this.panel.find("#custom_add_value").click(function(){
			var field = dialog.panel.find(".custom-pane .layer-fields").val();
			if(field == null || field == ""){
				MapCloud.notify.showInfo("请先选择一个字段","Warning");
				return;
			}
			if(dialog.dbLayer == null){
				MapCloud.notify.showInfo("当前图层为空","Warning");
				return;
			}
			MapCloud.query_dialog.showDialog();
			MapCloud.query_dialog.setLayer(dialog.dbLayer,field);
		});

		// 自定义样式删除一个rule
		this.panel.find("#custom_remove_value").click(function(){
			var table = dialog.panel.find(".custom-pane .style-list-table");
			var ruleSelected = table.find("tbody tr.selected");
			var rulesTr = table.find("tbody tr");
			var index = rulesTr.index(ruleSelected);
			if(index != -1){
				if(!confirm("确定删除该行样式吗？")){
					return;
				}
				dialog.customStyle.removeRule(index);
				var filters = dialog.getCustomStyleFilters(this.customStyle);
				dialog.customStyleFilters = filters;
				dialog.displayCustomStyle(dialog.customStyle);
			}
		});

		// 自定义样式删除所有值
		this.panel.find("#custom_remove_all_value").click(function(){
			dialog.customStyle = null;
			dialog.customStyleFilters = [];
			dialog.cleanupCustomPanel();
		});


		// 左侧样式类型选择
		this.panel.find(".list-group-item").click(function(){
			dialog.panel.find(".list-group-item").removeClass("active");
			$(this).addClass("active");
			if($(this).hasClass("single-style")){
				dialog.panel.find(".style-pane").css("display","none");
				dialog.panel.find(".single-pane").css("display","block");
			}else if($(this).hasClass("unique-style")){
				dialog.panel.find(".style-pane").css("display","none");
				dialog.panel.find(".unique-pane").css("display","block");
			}else if($(this).hasClass("quantities-style")){
				dialog.panel.find(".style-pane").css("display","none");
				dialog.panel.find(".quantities-pane").css("display","block");
			}else if($(this).hasClass("custom-style")){
				dialog.panel.find(".style-pane").css("display","none");
				dialog.panel.find(".custom-pane").css("display","block");
			}else if($(this).hasClass("dot-density-style")){
				dialog.panel.find(".style-pane").css("display","none");
				dialog.panel.find(".dot-density-pane").css("display","block");
				if(dialog.dotDensityStyle == null){
					var style = dialog.getDotDensityStyle(dialog.singleStyle);
					dialog.dotDensityStyle = style;
				}
				dialog.displayDotDensityStyle(dialog.dotDensityStyle);
			}
		});

		// 符号选择
		this.panel.find(".single-pane .symbol-icon").click(function(){
			if(dialog.singleStyle == null){
				return;
			}
			var type = null;
			var geomType = dialog.singleStyle.geomType;
			if(geomType == GeoBeans.Style.FeatureStyle.GeomType.Point){
				type = "marker";
			}else if(geomType == GeoBeans.Style.FeatureStyle.GeomType.LineString){
				type = "line"
			}else if(geomType == GeoBeans.Style.FeatureStyle.GeomType.Polygon){
				type = "fill";
			}
			dialog.symbolChangedClass = GeoBeans.Style.FeatureStyle.StyleClass.SINGLE;
			dialog.symbolChangedIndex = 0;
			var symbol = dialog.singleStyle.rules[0].symbolizer.symbol;
			var symbolName = null;
			if(symbol != null){
				symbolName = symbol.name;
			}
			MapCloud.symbol_dialog.showDialog("styleManager",type,symbolName);
		});
	},

	showDialog : function(flag){
		this.cleanup();
		this.panel.modal();
		var html = "All<span class='caret'></span>";
		this.panel.find("#style_type_name").html(html);

		// styleManager = new GeoBeans.StyleManager(url);
		// styleManager = styleManager;
		

		var styles = styleManager.getStyles();
		if(flag == null || flag == undefined){
			flag = true;
		}
		this.getStyles_callback(styles,flag);
		styleManager.getColorMaps(this.getColorMaps_callback);
	},

	cleanup : function(){
		this.panel.find("#styles_list_table").html("");
		this.typeName = null;
		// this.styleCur = null;
		this.styleNameCur = null;
		this.defaultStyle = null;
		this.uniqueValues = null;
		this.minMaxValue = null;
		this.wfsWorkspace = null;
		this.panel.find("#style_type_name").removeClass("disabled");
		this.panel.find("#layer_fields").html("");
		this.panel.find(".layer-fields").html("");

		this.panel.find("#add_style,#save_style,#remove_style").removeAttr("disabled");
		this.panel.find("#style_list").removeAttr("disabled");
		this.panel.find(".col-md-3 .list-group-item").removeClass("disabled");
		this.dbLayer = null;

		this.singleStyle = null;
		this.uniqueStyle = null;
		this.quantitiesStyle = null;
		this.customStyle = null;
		this.customStyleFilters = [];
		this.dotDensityStyle = null;

		this.cleanupUniquePanel();
		this.cleanupQuantitiesPanel();
		this.cleanupCustomPanel();
	},
	// 清空唯一值样式panel
	cleanupUniquePanel : function(){
		this.panel.find(".unique-pane .style-list-table").html("");
	},

	// 清空分级样式panel
	cleanupQuantitiesPanel : function(){
		this.panel.find(".quantities-pane .style-list-table").html("");
	},

	// 清空自定panel 
	cleanupCustomPanel : function(){
		this.panel.find(".custom-pane .style-list-table").html("");
	},

	//获得style的类型
	getStyleType : function(name){
		if(name == null){
			return null;
		}
		var type = null;
		switch(name){
			case "point":{
				type = GeoBeans.Style.FeatureStyle.GeomType.Point;
				break;
			}
			case "linestring":{
				type = GeoBeans.Style.FeatureStyle.GeomType.LineString;
				break; 
			}
			case "polygon":{
				type = GeoBeans.Style.FeatureStyle.GeomType.Polygon;
				break;
			}
			default:
				break;
		}
		return type;
	},

	closeDialog : function(){
		this.panel.modal("hide");
		MapCloud.refresh_panel.refreshPanel();
	},

	//展示获取的styles名字
	getStyles_callback : function(styles,flag){
		var html = "";
		var html = "";
		for(var i = 0; i < styles.length;++i){
			var style = styles[i];
			var name = style.name;
			var geomType = style.geomType;
			html += "<option value='" + name 
				 + "' type='" + geomType + "'>" + name + "</option>";
		}

		var dialog = MapCloud.styleManager_dialog;
		var panel = dialog.panel;
		panel.find("#style_list").html(html);
		
		if(flag == null || flag == undefined){
			flag = true;
		}
		//判断是否展示第一个样式
		if(flag){
			var styleName = panel.find("#style_list option:selected").val();
			dialog.styleNameCur = styleName;
			styleManager.getStyleXML(dialog.styleNameCur,
				dialog.getStyleXML_callback);
		}
	},

	//获取到的XML解析出style进行展示
	getStyleXML_callback : function(style){
		MapCloud.notify.hideLoading();
		if(style == null){
			return;
			this.panel.find(".style-pane").css("display","none");
		}
		var dialog = MapCloud.styleManager_dialog;
		var panel = dialog.panel;
		// dialog.styleCur = style;
		var styleClass = style.styleClass;
		if(styleClass == null || styleClass == ""){
			styleClass = dialog.getStyleClass(style);
		}
		dialog.setPanelStyle(style,styleClass);
	},

	// 获得样式的分类样式
	getStyleClass : function(style){
		if(style == null){
			return null;
		}
		var rules = style.rules;
		if(rules == null){
			return null;
		}
		if(rules.length == 1){
			var rule = rules[0];
			if(rule != null){
				var filter = rule.filter;
				if(filter == null){
					return GeoBeans.Style.FeatureStyle.StyleClass.SINGLE;
				}
			}
		}else{
			var uniqueCount = 0;
			var quantitiesCount = 0;
			for(var i = 0; i < rules.length;++i){
				var rule = rules[i];
				if(rule != null){
					var filter = rule.filter;
					if(filter != null){
						if(filter instanceof GeoBeans.BinaryComparisionFilter){
							var operator = filter.operator;
							if(operator == GeoBeans.ComparisionFilter
								.OperatorType.ComOprEqual){
								uniqueCount++;
							}
						}else if(filter instanceof GeoBeans.IsBetweenFilter){
							quantitiesCount++;
						}
					}
				}
			}
			if(uniqueCount == rules.length){
				return GeoBeans.Style.FeatureStyle.StyleClass.UNIQUE;
			}
			if(quantitiesCount == rules.length){
				return GeoBeans.Style.FeatureStyle.StyleClass.QUANTITIES;
			}
		}
		return null;
	},


	// 单一样式
	displaySingleStyle : function(style){
		if(style == null){
			return;
		}
		var rules = style.rules;
		if(rules == null){
			return;
		}
		var length = rules.length;
		if(length == 1){
			var rule = rules[0];
			if(rule == null){
				return;
			}
			var symbolizer = rule.symbolizer;
			if(symbolizer == null){
				return;
			}
			var cssObj = this.getStyleSymbolCss(symbolizer);
			this.panel.find(".single-pane .style-symbol")
				.css(cssObj);

			var icon = null;
			var symbol = symbolizer.symbol;
			if(symbol != null){
				var name = symbol.name;
				icon = symbol.icon;
				if(icon == null){
					var type = this.getSymbolIconType(symbolizer.type); 
					icon = styleManager.getSymbolIcon(type,name);
				}
				
			}else{
				switch(symbolizer.type){
					case GeoBeans.Symbolizer.Type.Point:{
						icon = "../images/Circle.png";
						break;
					}
					case GeoBeans.Symbolizer.Type.Line:{
						icon = "../images/SimpleLine.png";
						break;
					}
					case GeoBeans.Symbolizer.Type.Polygon:{
						icon = "../images/SimpleRegion.png";
						break;
					}
					default:
						break;
				}
			}
			var url = "url(" + icon + ")";
			this.panel.find(".single-pane .symbol-icon")
				.css("background-image",url);
		}
	},

	// 唯一值样式
	displayUniqueStyle : function(style){
		if(style == null){
			return;
		}
		var field = this.getProperyNameByRule(
				style.rules[0]);
		var fieldOption = this.panel.find(".unique-pane .layer-fields option[value='" +
							field + "']");
		fieldOption.attr("selected",true);
		var html = this.getRulesListHtml(field,style.rules);
		this.panel.find(".unique-pane .style-list-table").html(html);
		this.registerUniqueSymbolEvent();
		this.registerUniqueSymbolIconEvent();
		this.registerUnqiueSelectEvent();
	},

	// 分级样式
	displayQuantitiesStyle : function(style){
		var field = this.getProperyNameByRule(
				style.rules[0]);
		var fieldOption = this.panel.find(".quantities-pane .layer-fields option[value='" +
							field + "']");
		fieldOption.attr("selected",true);
		// set classes count
		var count = style.rules.length;
		var classesOption = this.panel.find(".quantities-pane .classes option[value='" + count + "']");
		classesOption.attr("selected",true);

		var html = this.getRulesListHtml(field,style.rules);
		this.panel.find(".quantities-pane .style-list-table").html(html);
		this.registerQuantitiesSymbolEvent();
		this.registerQuantitiesSymbolIconEvent();
		this.registerQuantitiesSelectEvent();
	},

	// 自定义样式
	displayCustomStyle : function(style){
		if(style == null){
			return;
		}
		var html = this.getRulesHtml(style.rules);
		this.panel.find(".custom-pane .style-list-table").html(html);
		this.registerCustomSymbolEvent();
		this.registerCustomSymbolIconEvent();
		this.registerCustomSelectEvent();
	},

	// 点密度样式
	displayDotDensityStyle : function(style){
		if(style == null){
			return;
		}
		var rules = style.rules;
		if(rules == null){
			return;
		}
		var length = rules.length;
		if(length != 1){
			return;
		}
		var rule = rules[0];
		if(rule == null){
			return;
		}
		var symbolizer = rule.symbolizer;
		if(symbolizer == null){
			return;
		}
		var cssObj = this.getStyleSymbolCss(symbolizer);
		this.panel.find(".dot-density-pane .style-symbol").css(cssObj);

		var field = style.field;
		if(field != null){
			var fieldOption = this.panel.find(".dot-density-pane .layer-fields option[value='" +
							field + "']");
			fieldOption.attr("selected",true);
		}
	},
	 
	// 设置各个panel的style,并设置各个页面的展示
	setPanelStyle : function(style,styleClass){
		var singleStyle = this.getSingleStyle(style);
		this.singleStyle = singleStyle;
		if(style.geomType != GeoBeans.Style.FeatureStyle.GeomType.Polygon){
			this.panel.find(".dot-density-style").addClass('disabled');
		}else{
			// 面符号则需要设置点密度样式
			this.panel.find(".dot-density-style").removeClass('disabled');
		}
		// 都需要展示单一值页面
		this.displaySingleStyle(this.singleStyle);
		if(styleClass == GeoBeans.Style.FeatureStyle.StyleClass.SINGLE){
			this.uniqueStyle = null;
			this.quantitiesStyle = null;
			this.customStyle = null;
			this.cleanupUniquePanel();
			this.cleanupQuantitiesPanel();
			this.cleanupCustomPanel();
			this.panel.find(".style-pane").css("display","none");
			this.panel.find(".single-pane").css("display","block");
			this.panel.find(".list-group-item").removeClass("active");
			this.panel.find(".single-style").addClass("active");
		}else if(styleClass == GeoBeans.Style.FeatureStyle.StyleClass.UNIQUE){
			this.uniqueStyle = style.clone();
			this.quantitiesStyle = null;
			this.customStyle = null;
			this.cleanupQuantitiesPanel();
			this.cleanupCustomPanel();
			this.displayUniqueStyle(this.uniqueStyle);
			this.panel.find(".style-pane").css("display","none");
			this.panel.find(".unique-pane").css("display","block");
			this.panel.find(".list-group-item").removeClass("active");
			this.panel.find(".unique-style").addClass("active");
		}else if(styleClass == GeoBeans.Style.FeatureStyle.StyleClass.QUANTITIES){
			this.uniqueStyle = null;
			this.customStyle = null;
			this.cleanupUniquePanel();
			this.cleanupCustomPanel();
			this.quantitiesStyle = style.clone();
			this.displayQuantitiesStyle(style);
			this.panel.find(".style-pane").css("display","none");
			this.panel.find(".quantities-pane").css("display","block");
			this.panel.find(".list-group-item").removeClass("active");
			this.panel.find(".quantities-style").addClass("active");
		}else if(styleClass == GeoBeans.Style.FeatureStyle.StyleClass.CUSTOM){
			this.uniqueStyle = null;
			this.quantitiesStyle = null;
			this.cleanupUniquePanel();
			this.cleanupQuantitiesPanel();
			this.customStyle = style.clone();
			this.displayCustomStyle(this.customStyle);
			var filters = this.getCustomStyleFilters(this.customStyle);
			this.customStyleFilters = filters;
			this.panel.find(".style-pane").css("display","none");
			this.panel.find(".custom-pane").css("display","block");
			this.panel.find(".list-group-item").removeClass("active");
			this.panel.find(".custom-style").addClass("active");
		}else if(styleClass == GeoBeans.Style.FeatureStyle.StyleClass.DOTDENSITY){
			this.dotDensityStyle = style.clone();
			this.displayDotDensityStyle(this.dotDensityStyle);

			this.panel.find(".style-pane").css("display","none");
			this.panel.find(".dot-density-pane").css("display","block");
			this.panel.find(".list-group-item").removeClass("active");
			this.panel.find(".dot-density-style").addClass("active");
		}
	},

	// 单一值修改样式
	registerSingleSymbolEvent : function(){
		var dialog = this;
		this.panel.find(".single-pane .style-symbol").click(function(){
			if(dialog.singleStyle != null){
				var rules = dialog.singleStyle.rules;
				if(rules != null){
					var rule = rules[0];
					MapCloud.style_dialog.setRule(rule,dialog.fields,"styleMgr");
					MapCloud.style_dialog.showDialog();	
					dialog.styleChangedClass = GeoBeans.Style.FeatureStyle.StyleClass.SINGLE;
					dialog.styleChangedIndex = 0;
				}
			}
		});	
	},
	// 唯一值修改样式
	registerUniqueSymbolEvent : function(){
		var dialog = this;
		this.panel.find(".unique-pane .style-symbol").click(function(){
			var symbols = $(this).parents("tbody").find(".style-symbol");
			var index = symbols.index($(this));
			if(index != -1 && dialog.uniqueStyle != null){
				var rules = dialog.uniqueStyle.rules;
				if(rules != null){
					var rule = rules[index];
					MapCloud.style_dialog.setRule(rule,dialog.fields,"styleMgr");
					MapCloud.style_dialog.showDialog();	
					dialog.styleChangedClass = GeoBeans.Style.FeatureStyle.StyleClass.UNIQUE;
					dialog.styleChangedIndex = index;
				}
			}
		});
	},

	// 修改唯一值符号
	registerUniqueSymbolIconEvent : function(){
		var dialog = this;
		this.panel.find(".unique-pane .symbol-icon").click(function(){
			var symbols = $(this).parents("tbody").find(".symbol-icon");
			var index = symbols.index($(this));
			if(index != -1 && dialog.uniqueStyle != null){
				var rules = dialog.uniqueStyle.rules;
				if(rules != null){
					var rule = rules[index];
					if(rule != null){
						var symbolizer = rule.symbolizer;
						if(symbolizer != null){
							var symbol = symbolizer.symbol;
							var symbolName = null;
							if(symbol != null){
								symbolName = symbol.name;
							}
							var type = dialog.getSymbolIconType(symbolizer.type);
							MapCloud.symbol_dialog.showDialog("styleManager",type,symbolName);
							dialog.symbolChangedClass = GeoBeans.Style.FeatureStyle.StyleClass.UNIQUE;
							dialog.symbolChangedIndex = index;
						}
					}
				}
			}	
		});
	},

	// 选中一行唯一值样式
	registerUnqiueSelectEvent : function(){
		var dialog = this;
		this.panel.find(".unique-pane .style-list-table tbody tr").click(function(){
			dialog.panel.find(".unique-pane .style-list-table tr").removeClass("selected");
			$(this).addClass("selected");
		});
	},

	// 分级样式修改样式
	registerQuantitiesSymbolEvent : function(){
		var dialog = this;
		this.panel.find(".quantities-pane .style-symbol").click(function(){
			var symbols = $(this).parents("tbody").find(".style-symbol");
			var index = symbols.index($(this));
			if(index != -1 && dialog.quantitiesStyle != null){
				var rules = dialog.quantitiesStyle.rules;
				if(rules != null){
					var rule = rules[index];
					MapCloud.style_dialog.setRule(rule,dialog.fields,"styleMgr");
					MapCloud.style_dialog.showDialog();	
					dialog.styleChangedClass = GeoBeans.Style.FeatureStyle.StyleClass.QUANTITIES;
					dialog.styleChangedIndex = index;
				}
			}
		});	
	},

	// 分机样式符号修改
	registerQuantitiesSymbolIconEvent : function(){
		var dialog = this;
		dialog.panel.find(".quantities-pane .symbol-icon").click(function(){
			var symbols = $(this).parents("tbody").find(".symbol-icon");
			var index = symbols.index($(this));
			if(index != -1 && dialog.quantitiesStyle != null){
				var rules = dialog.quantitiesStyle.rules;
				if(rules != null){
					var rule = rules[index];
					if(rule != null){
						var symbolizer = rule.symbolizer;
						if(symbolizer != null){
							var symbol = symbolizer.symbol;
							var symbolName = null;
							if(symbol != null){
								symbolName = symbol.name;
							}
							var type = dialog.getSymbolIconType(symbolizer.type);
							MapCloud.symbol_dialog.showDialog("styleManager",type,symbolName);
							dialog.symbolChangedClass = GeoBeans.Style.FeatureStyle.StyleClass.QUANTITIES;
							dialog.symbolChangedIndex = index;
						}
					}
				}
			}	
		});
	},
	// 分级样式的一行选择
	registerQuantitiesSelectEvent : function(){
		var dialog = this;
		this.panel.find(".quantities-pane .style-list-table tbody tr").click(function(){
			dialog.panel.find(".quantities-pane .style-list-table tr").removeClass("selected");
			$(this).addClass("selected");
		});
	},
	// 自定义样式修改样式
	registerCustomSymbolEvent : function(){
		var dialog = this;
		this.panel.find(".custom-pane .style-symbol").click(function(){
			var symbols = $(this).parents("tbody").find(".style-symbol");
			var index = symbols.index($(this));
			if(index != -1 && dialog.customStyle != null){
				var rules = dialog.customStyle.rules;
				if(rules != null){
					var rule = rules[index];
					MapCloud.style_dialog.setRule(rule,dialog.fields,"styleMgr");
					MapCloud.style_dialog.showDialog();	
					dialog.styleChangedClass = GeoBeans.Style.FeatureStyle.StyleClass.CUSTOM;
					dialog.styleChangedIndex = index;
				}
			}
		});	
	},

	// 自定义样式符号
	registerCustomSymbolIconEvent : function(){
		var dialog = this;
		dialog.panel.find(".custom-pane .symbol-icon").click(function(){
			var symbols = $(this).parents("tbody").find(".symbol-icon");
			var index = symbols.index($(this));
			if(index != -1 && dialog.customStyle != null){
				var rules = dialog.customStyle.rules;
				if(rules != null){
					var rule = rules[index];
					if(rule != null){
						var symbolizer = rule.symbolizer;
						if(symbolizer != null){
							var symbol = symbolizer.symbol;
							var symbolName = null;
							if(symbol != null){
								symbolName = symbol.name;
							}
							var type = dialog.getSymbolIconType(symbolizer.type);
							MapCloud.symbol_dialog.showDialog("styleManager",type,symbolName);
							dialog.symbolChangedClass = GeoBeans.Style.FeatureStyle.StyleClass.CUSTOM;
							dialog.symbolChangedIndex = index;
						}
					}
				}
			}	
		});
	},

	// 自定义样式选中一行
	registerCustomSelectEvent : function(){
		var dialog = this;
		this.panel.find(".custom-pane .style-list-table tbody tr").click(function(){
			dialog.panel.find(".custom-pane .style-list-table tr").removeClass("selected");
			$(this).addClass("selected");
		});
	},

	// 点密度样式的修改样式
	registerDotDensitySymbolEvent : function(){
		var dialog = this;
		this.panel.find(".dot-density-pane .style-symbol").click(function(){
			if(dialog.dotDensityStyle != null){
				var rules = dialog.dotDensityStyle.rules;
				if(rules != null){
					var rule = rules[0];
					MapCloud.style_dialog.setRule(rule,dialog.fields,"styleMgr");
					MapCloud.style_dialog.showDialog();	
					dialog.styleChangedClass = GeoBeans.Style.FeatureStyle.StyleClass.DOTDENSITY;
					dialog.styleChangedIndex = 0;
				}
			}
		});	
	},

	// 获得单一样式值，取第一个样式
	getSingleStyle : function(style){
		if(style == null){
			return null;
		}
		var rules = style.rules;
		if(rules == null){
			return;
		}
		var geomType = style.geomType;
		var styleClass = style.styleClass;
		var singleStyle = null;
		if(rules.length >= 1){
			var rule = rules[0];
			if(rule != null){
				var textSymbolizer = rule.textSymbolizer;
				var symbolizer = rule.symbolizer;
				var singleStyle = new GeoBeans.Style.FeatureStyle("single",geomType);
				singleStyle.styleClass = GeoBeans.Style.FeatureStyle.StyleClass.SINGLE;
				var rule = new GeoBeans.Rule();
				if(symbolizer != null){
					if(styleClass == GeoBeans.Style.FeatureStyle.StyleClass.DOTDENSITY){
						var fill =  symbolizer.fill;
						var stroke = symbolizer.stroke;
						var polygonSymbolizer = new GeoBeans.Symbolizer.PolygonSymbolizer();
						if(fill != null){
							polygonSymbolizer.fill = fill.clone();
						}
						if(stroke != null){
							polygonSymbolizer.stroke = stroke.clone();
						}
						rule.symbolizer = polygonSymbolizer;
						singleStyle.geomType = GeoBeans.Style.FeatureStyle.GeomType.Polygon;
					}else{
						rule.symbolizer = symbolizer.clone();
					}
				}
				if(textSymbolizer != null){
					rule.textSymbolizer = textSymbolizer.clone();
				}
				singleStyle.addRule(rule);
			}
		}
		return singleStyle;
	},

	// 获取点密度的样式，从单一值上获取
	getDotDensityStyle : function(style){
		if(style == null){
			return null;
		}
		var geomType = GeoBeans.Style.FeatureStyle.GeomType.Point;
		var dotDensityStyle = new GeoBeans.Style.FeatureStyle("dotDensity",geomType);
		dotDensityStyle.styleClass = GeoBeans.Style.FeatureStyle.StyleClass.DOTDENSITY;
		var rule = new GeoBeans.Rule();
		var pointSymbolizer = new GeoBeans.Symbolizer.PointSymbolizer();

		var rules = style.rules;
		if(rules != null){
			var singleRule = rules[0];
			if(rule != null){
				var symbolizer = singleRule.symbolizer;
				if(symbolizer != null){
					var fill = symbolizer.fill;
					var stroke = symbolizer.stroke;
					if(fill != null){
						pointSymbolizer.fill = fill.clone();
					}
					if(stroke != null){
						pointSymbolizer.stroke = stroke.clone();
					}
				}
			}
		}

		rule.symbolizer = pointSymbolizer;
		dotDensityStyle.addRule(rule);
		return dotDensityStyle;
	},

	// 样式CSS
	getStyleSymbolCss : function(symbolizer){
		var cssObj = {};
		var stroke = null;
		var fill = null;
		var strokeColor = null;
		var strokeColorRgba = null;
		var fillColor = null;
		var fillColorRgba = null;
		var type = symbolizer.type;
		switch(type){
			case GeoBeans.Symbolizer.Type.Point:{
				stroke = symbolizer.stroke;
				if(stroke != null){
					strokeColor = stroke.color;
					strokeColorRgba = strokeColor.getRgba();
				}
				var fill = symbolizer.fill;
				if(fill != null){
					fillColor = fill.color;
					fillColorRgba = fillColor.getRgba();
				}
				cssObj = {"background-color":fillColorRgba,
						 "border-color": strokeColorRgba};
				break;
			}
			case GeoBeans.Symbolizer.Type.Line:{
				var stroke = symbolizer.stroke;
				if(stroke != null){
					strokeColor = stroke.color;
					strokeColorRgba = strokeColor.getRgba();
				}
				cssObj = {"background-color":strokeColorRgba,
						  "border-color": "#fff"};
				break;
			}
			case GeoBeans.Symbolizer.Type.Polygon:{
				stroke = symbolizer.stroke;
				if(stroke != null){
					strokeColor = stroke.color;
					strokeColorRgba = strokeColor.getRgba();
				}
				var fill = symbolizer.fill;
				if(fill != null){
					fillColor = fill.color;
					fillColorRgba = fillColor.getRgba();
				}
				cssObj = {"background-color":fillColorRgba,
						 "border-color": strokeColorRgba};
				break;
			}
			default:
				break;
		}
		return cssObj;
	},

	//style的html
	getSymbolHtml : function(symbolizer){
		var type = symbolizer.type;
		var html = "";
		var strokeColor = null;
		var strokeColorRgba = null;
		var fillColor = null;
		var fillColorRgba = null;
		if(type == GeoBeans.Symbolizer.Type.Point){
			var stroke = symbolizer.stroke;
			if(stroke != null){
				strokeColor = stroke.color;
				strokeColorRgba = strokeColor.getRgba();
			}
			var fill = symbolizer.fill;
			if(fill != null){
				fillColor = fill.color;
				fillColorRgba = fillColor.getRgba();
			}
			html = '<div class="style-symbol" style="'
				+  'background-color:' + fillColorRgba
				+  ';border-color:' + strokeColorRgba
				+  '"></div>';
		}else if(type == GeoBeans.Symbolizer.Type.Line){
			var stroke = symbolizer.stroke;
			if(stroke != null){
				strokeColor = stroke.color;
				strokeColorRgba = strokeColor.getRgba();
			}
			html = '<div class="style-symbol" style="'
				+  'background-color:' + strokeColorRgba
				+  '"></div>';
		}else if(type == GeoBeans.Symbolizer.Type.Polygon){
			var stroke = symbolizer.stroke;
			if(stroke != null){
				strokeColor = stroke.color;
				strokeColorRgba = strokeColor.getRgba();
			}
			var fill = symbolizer.fill;
			if(fill != null){
				fillColor = fill.color;
				fillColorRgba = fillColor.getRgba();
			}
			html = '<div class="style-symbol" style="'
				+  'background-color:' + fillColorRgba
				+  ';border-color:' + strokeColorRgba
				+  '"></div>';
		}
		return html;
	},

	// 获取符号的样式
	getSymbolIconHtml : function(symbolizerType,symbol){
		var html = "";
		var icon = null;
		if(symbol != null){
			icon = symbol.icon;
			if(icon == null){
				var type = this.getSymbolIconType(symbolizerType);
				icon = styleManager.getSymbolIcon(type,symbol.name);
			}
		}
		
		if(icon == null){
			switch(symbolizerType){
				case GeoBeans.Symbolizer.Type.Point:{
					icon = "../images/Circle.png";
					break;
				}
				case GeoBeans.Symbolizer.Type.Line:{
					icon = "../images/SimpleLine.png";
					break;
				}
				case GeoBeans.Symbolizer.Type.Polygon:{
					icon = "../images/SimpleRegion.png";
					break;
				}
				default:
					break;
			}
			console.log('symbol is null');
		}
		var html = "<div class='symbol-icon' style='background-image:url(" 
				+ icon  + ")'></div>";
		return html;

	},

	//根据rule拿到是哪个字段
	getProperyNameByRule : function(rule){
		if(rule == null){
			return null;
		}
		var filter = rule.filter;
		if(filter == null){
			return null;
		}
		var type = filter.type;
		if(type == GeoBeans.Filter.Type.FilterComparsion){
			var operator = filter.operator;
			if(operator == GeoBeans.ComparisionFilter.OperatorType.ComOprEqual){
				var expression1 = filter.expression1;
				var expressionType = expression1.type;
				if(expressionType == GeoBeans.Expression.Type.PropertyName){
					var name = expression1.name;
					return name; 
				}
				var expression2 = filter.expression2;
				expressionType = expression2.type;
				if(expressionType == GeoBeans.Expression.Type.PropertyName){
					var name = expression1.name;
					return name; 
				}
			}else if(operator == GeoBeans.ComparisionFilter.OperatorType.ComOprIsBetween){
				var expression = filter.expression;
				if(expression != null){
					var name = expression.name;
					return name;
				}
			}
		}
		return null;
	},

	//生成所有Style的rules的table代码
	getRulesListHtml : function(field,rules){
		if(rules == null){
			return;
		}
		var html = "<thead>"
				+  "	<tr>"
				+ "		<th class='style-col'><span>&nbsp;</span></th>"
				+ "		<th class='style-col'><span>&nbsp;</span></th>"
				+  "		<th class='value-col'>值列表</th>"
				+  "		<th class='value-col'>" + field + "</th>"
				+  "	</tr>"
				+  "</thead>"
				+  "<tbody>";
		for(var i = 0; i < rules.length; ++i){
			var rule = rules[i];
			var filter = rule.filter;
			var value = "";
			if(filter == null){
				continue;
			}
			var type = filter.type;
			if(type == GeoBeans.Filter.Type.FilterComparsion){
				var operator = filter.operator;
				if(operator == GeoBeans.ComparisionFilter.OperatorType.ComOprEqual){
					var expression1 = filter.expression1;
					var expression2 = filter.expression2;
					if(expression1 != null && 
						expression1.type == GeoBeans.Expression.Type.Literal){
						value = expression1.value;
					}else if(expression2 != null && 
						expression2.type == GeoBeans.Expression.Type.Literal){
						value = expression2.value;
					}
				}else if(operator == GeoBeans.ComparisionFilter.OperatorType.ComOprIsBetween){
					var lowerBound = filter.lowerBound;
					var upperBound = filter.upperBound;
					var lowerBoundValue = "";
					var upperBoundValue = "";
					if(lowerBound != null){
						lowerBoundValue = parseFloat(lowerBound.value);
					}
					if(upperBound != null){
						upperBoundValue = parseFloat(upperBound.value);
					}
					value = lowerBoundValue.toFixed(2) + "-" + upperBoundValue.toFixed(2);
				}
			}
			var symbolizer = rule.symbolizer;
			var symbolHtml = this.getSymbolHtml(symbolizer);
			var symbolIconHtml = this.getSymbolIconHtml(symbolizer.type,symbolizer.symbol);
			html += "<tr>"
				+ "		<td class='style-col'>"
				+ 			symbolHtml
				+ "		</td>"
				+ "		<td class='style-col'>"
				+ 			symbolIconHtml
				+ "		</td>"
				+ "		<td class='value-col'>"
				+ 			value 
				+ "		</td>"
				+ "		<td value='value-col'>"
				+ 			value
				+ "		</td>"
				+ "	</tr>";
		}
		html += "</tbody>";
		return html;
	},

	// 删除样式的结果
	removeStyle_callback : function(result){
		var dialog = MapCloud.styleManager_dialog;
		var panel = dialog.panel;
		
		var name = dialog.panel.find("#style_list option:selected").text();
		var info = "删除样式 [ " + name + " ]";
		MapCloud.notify.showInfo(result,info);
		panel.find(".style-pane").css("display","none");

		if(result.toUpperCase() == "SUCCESS"){
			// 重新拿样式列表
			var value = panel.find("#style_type_name").text();
			value = value.toLowerCase();
			if(value == "all"){
				var styles = styleManager.getStyles();
				dialog.getStyles_callback(styles);
			}else{
				var type = dialog.getStyleType(value);
				if(type != null){
					var styles = styleManager.getStyleByType(type);
					dialog.getStyles_callback(styles);
				}
			}
		}
	},

	//选中一个样式
	registerStyleSelected : function(){
		var tr = this.panel.find(".unique-pane .style-list-table tbody tr").each(function(){
			$(this).click(function(){
				$(this).parent().children().removeClass("selected");
				$(this).addClass("selected");
			});
		});
	},

	// 设置styleDialog返回回来的rule
	setRule : function(rule){
		if(rule == null){
			return;
		}
		if(this.styleChangedClass == GeoBeans.Style.FeatureStyle.StyleClass.SINGLE 
			&& this.styleChangedIndex == 0){
			var symbol = this.singleStyle.rules[0].symbolizer.symbol;
			rule.symbolizer.symbol = symbol;
			this.singleStyle.rules[0] = rule;
			this.displaySingleStyle(this.singleStyle);
		}else if(this.styleChangedClass == GeoBeans.Style.FeatureStyle.StyleClass.UNIQUE){
			var symbol = this.uniqueStyle.rules[this.styleChangedIndex].symbolizer.symbol;
			rule.symbolizer.symbol = symbol;
			this.uniqueStyle.rules[this.styleChangedIndex].symbolizer = rule.symbolizer;
			this.uniqueStyle.rules[this.styleChangedIndex].textSymbolizer = rule.textSymbolizer;
			this.displayUniqueStyle(this.uniqueStyle);
		}else if(this.styleChangedClass == GeoBeans.Style.FeatureStyle.StyleClass.QUANTITIES){
			var symbol = this.quantitiesStyle.rules[this.styleChangedIndex].symbolizer.symbol;
			rule.symbolizer.symbol = symbol;
			this.quantitiesStyle.rules[this.styleChangedIndex].symbolizer = rule.symbolizer;
			this.quantitiesStyle.rules[this.styleChangedIndex].textSymbolizer = rule.textSymbolizer;
			this.displayQuantitiesStyle(this.quantitiesStyle);
		}else if(this.styleChangedClass == GeoBeans.Style.FeatureStyle.StyleClass.CUSTOM){
			var symbol = this.customStyle.rules[this.styleChangedIndex].symbolizer.symbol;
			rule.symbolizer.symbol = symbol;
			this.customStyle.rules[this.styleChangedIndex].symbolizer = rule.symbolizer;
			this.customStyle.rules[this.styleChangedIndex].textSymbolizer = rule.textSymbolizer;
			this.displayCustomStyle(this.customStyle);
		}else if(this.styleChangedClass == GeoBeans.Style.FeatureStyle.StyleClass.DOTDENSITY){
			var symbol = this.dotDensityStyle.rules[this.styleChangedIndex].symbolizer.symbol;
			rule.symbolizer.symbol = symbol;
			this.dotDensityStyle.rules[this.styleChangedIndex].symbolizer = rule.symbolizer;
			this.dotDensityStyle.rules[this.styleChangedIndex].textSymbolizer = rule.textSymbolizer;
			this.displayDotDensityStyle(this.dotDensityStyle);
		}
	},

	// 设置新增的样式名称
	setAddStyleName : function(styleName,flag){
		if(styleName == null){
			return;
		}
		this.addStyleName = styleName;
		var style = styleManager.getStyle(styleName);
		if(style != null){
			var info = "已经有" + styleName + "样式，请重新输入";
			MapCloud.notify.showInfo("failed",info);
			MapCloud.styleName_dialog.showDialog();
			return;
		}
		var styleOptions = this.panel.find("#style_list");
		if(flag == "add"){
			var type = this.panel.find("#style_type_name").text();
			var styleType = this.getStyleType(type.toLowerCase())
			var option = '<option value="' + styleName + '" type="' 
						+ styleType + '">' + styleName + '</option>';
			styleOptions.append(option);
			styleOptions.find("option[value='" 
					+ styleName + "']").attr("selected",true);
			this.loadAddStyle(styleType);
		}else if(flag == "save"){
			//默认样式则修改名称 待修改
			this.panel.find("#style_list option[value='default']").text(styleName);
			var style = this.getCurrentStyle();
			this.addStyle(style);
		}
	},

	//页面上展示从本地读到的样式
	loadAddStyle : function(styleType){
		if(styleType == null){
			return;
		}
		var that = this;
		var path = null;
		switch(styleType){
			case GeoBeans.Style.FeatureStyle.GeomType.Point:{
				path = "js/StyleXML/point.xml";
				break;
			}
			case GeoBeans.Style.FeatureStyle.GeomType.LineString:{
				path = "js/StyleXML/line.xml";
				break;
			}
			case GeoBeans.Style.FeatureStyle.GeomType.Polygon:{
				path = "js/StyleXML/polygon.xml";
				break;
			}
			default:
				break;
		}	
		$.get(path,function(xml){
			var style = styleManager.reader.read(xml);
			style.name = that.addStyleName;
			var geomType = that.panel.find("#style_type_name").text();
			style.geomType = geomType;
			that.getStyleXML_callback(style);
		});
	},

	// 获得当前设置完的样式值
	getCurrentStyle : function(){
		var activeItem = this.panel.find(".list-group-item.active");
		if(activeItem.hasClass("single-style")){
			return this.singleStyle;
		}else if(activeItem.hasClass("unique-style")){
			return this.uniqueStyle;
		}else if(activeItem.hasClass("quantities-style")){
			return this.quantitiesStyle;
		}else if(activeItem.hasClass("custom-style")){
			return this.customStyle;
		}else if(activeItem.hasClass('dot-density-style')){
			var field = this.panel.find(".dot-density-pane .layer-fields").val();
			if(field == null || field == ""){
				MapCloud.notify.showInfo("请选择一个字段","Warning");
				return null;
			}
			this.dotDensityStyle.field = field;
			return this.dotDensityStyle;
		}
	},

	// 更新style
	updateStyle : function(style){
		if(style == null){
			return;
		}
		var name = style.name;
		//如果是默认样式，则不绘制。
		if(name == "default"){
			return;
		}
		var xml = styleManager.writer.write(style);
		MapCloud.notify.loading();
		styleManager.updateStyle(xml,name,this.updateCallback);
	},

	// 更新样式结果
	updateCallback : function(result){
		var dialog = MapCloud.styleManager_dialog;
		var panel = dialog.panel;
		var styleName = panel
					.find("#style_list option:selected").text();
		var info = "更新样式 [ " + styleName + " ]";
		MapCloud.notify.showInfo(result,info);
	},

	// 增加样式
	addStyle : function(style){
		if(style == null){
			return;
		}
		var xml =styleManager.writer.write(style);
		if(xml == null){
			return;
		}
		var name = style.name;
		var geomType = style.geomType;
		MapCloud.notify.loading();
		styleManager.addStyle(xml,name
				,geomType,this.addStyleCallback);
	},

	// 增加样式结果
	addStyleCallback : function(result){
		var dialog = MapCloud.styleManager_dialog;

		var type = dialog.panel.find("#style_type_name").text();
		var styleType = dialog.getStyleType(type.toLowerCase());
		var styles = styleManager.getStyleByType(styleType);
		dialog.getStyles_callback(styles);

		var styleName = dialog.addStyleName;

		var info = "添加样式 [ " + styleName + " ]";
		MapCloud.notify.showInfo(result,info);

		var styleOption = dialog.panel.find("#style_list option[value='" +
							styleName + "']");
		styleOption.attr("selected",true);
		dialog.panel.find("#styles_list_table").html("");
		dialog.defaultStyle = null;
		dialog.styleCur =  null;
		dialog.styleNameCur = dialog.addStyleName;
		dialog.isDefaultStyle = false;	
		// 通过名字获取到style
		var style = styleManager.getStyle(styleName);
		if(style != null){
			styleManager.getStyleXML(styleName,
			dialog.getStyleXML_callback);
		}
		dialog.addStyleName = null;

		if(dialog.setLayerStyleFlag){
			if(dialog.typeName != null){
				// 给当前图层设定样式
				var currentStyle = dialog.getCurrentStyle();
				dialog.setStyle(dialog.typeName,currentStyle,dialog.setStyle_callback);
			}
		}
		dialog.setLayerStyleFlag = false;
	},

	/******************绑定图层*************/

	// wfsLayer
	setWFSLayer : function(wfsLayer){
		if(wfsLayer == null){
			return;
		}
		this.wfsLayer = wfsLayer;
		var workspace = this.wfsLayer.workspace;
		this.wfsWorkspace = workspace;
		var style = this.wfsLayer.style;
		if(style == null){
			return;
		}
		this.typeName = this.wfsLayer.name;
		var fields = wfsLayer.featureType.fields;
		this.setFields(fields);

		var styleName = style.name;
		this.styleNameCur = styleName;
		var styleGeomType = style.geomType;
		var styleGeomTypeOptions = this.panel
						.find("#style_list option[type='" + styleGeomType + "']");
		var html = styleGeomType + "<span class='caret'></span>";
		this.panel.find("#style_type_name").html(html);
		this.panel.find("#style_type_name").addClass("disabled");
		var styleOptions = this.panel.find("#style_list");
		styleOptions.html(styleGeomTypeOptions);

		//
		var styleS = styleManager.getStyle(styleName);
		if(styleName == "default" ||styleS == null){
			styleOptions.append("<option value='default'>default</option>");
			styleOptions.find("option[value='default']")
					.attr("selected",true);
			//证明是默认的样式
			this.getStyleXML_callback(style);
		}else{
			//证明是某一个样式
			styleOptions.find("option[value='" + styleName + "']")
					.attr("selected",true);
			this.getStyleXML_callback(style);
		}

		// 只让设置默认的样式，不让选择其它的
		this.setWFSLayerPanelStyle();
	},

	setWFSLayerPanelStyle : function(){
		this.panel.find("#add_style,#save_style,#remove_style").attr("disabled","true");
		this.panel.find("#style_list").attr("disabled","true");
		this.panel.find(".col-md-3 .list-group-item").addClass("disabled");
		this.panel.find(".single-pane .symbol-icon").unbind("click");
	},

	//DBLayer
	setDBLayer : function(dbLayer){
		if(dbLayer == null){
			return;
		}
		this.dbLayer = dbLayer;
		this.typeName = dbLayer.name;

		this.wfsWorkspace = new GeoBeans.WFSWorkspace("tmp",
				mapObj.server,"1.0.0");
		// var featureType = new GeoBeans.FeatureType(this.wfsWorkspace,
		// 		this.dbLayer.name);
		// var fields = featureType.getFields(mapObj.name);
		var fields = dbLayer.getFields();
		this.setFields(fields);

		

		var geomType = this.dbLayer.geomType;
		var styleGeomType = this.getStyleTypeByGeomType(geomType);
		var styleGeomTypeOptions = this.panel
						.find("#style_list option[type='" + styleGeomType + "']");
		var html = styleGeomType + "<span class='caret'></span>";
		this.panel.find("#style_type_name").html(html);
		this.panel.find("#style_type_name").addClass("disabled");
		var styleOptions = this.panel.find("#style_list");
		styleOptions.html(styleGeomTypeOptions);

		var styleName = this.dbLayer.styleName;
		if(styleName != null  && styleName != ""){
			this.styleNameCur = styleName;

			styleOptions.find("option[value='" + styleName + "']")
						.attr("selected",true);
			styleManager.getStyleXML(this.styleNameCur,
				this.getStyleXML_callback);
		}else{
			var styles = styleManager.getStyleByType(styleGeomType);
			this.getStyles_callback(styles);
		}
		
	},

	// 设置字段
	setFields : function(fields){
		if(fields == null){
			return;
		}
		// 唯一值panel字段设置
		this.fields = fields;
		var html = "";
		var field,name;
		for(var i = 0; i < fields.length;++i){
			field = fields[i];
			if(field != null){
				name = field.name;
				html += "<option value='" + name + "'>" + name + "</option>";
			}
		}
		this.panel.find(".unique-pane .layer-fields").html(html);
		var dialog = this;
		this.panel.find(".unique-pane .layer-fields").each(function(){
			$(this).change(function(){
				dialog.panel.find(".unique-pane .style-list-table").html("");
				dialog.uniqueStyle = null;
			});
		});

		// 分级样式字段设置
		var quantitiesFieldsHtml = "<option value='none'>none</option>";
		html = null;
		var type = null;
		for(var i = 0; i < fields.length; ++i){
			field = fields[i];
			type = field.type;
			if(type == "int" || type == "double" || type == "float"){
				name = field.name;
				html += "<option value='" + name + "'>" + name + "</option>";
			}
		}
		quantitiesFieldsHtml += html;
		this.panel.find(".quantities-pane .layer-fields").html(quantitiesFieldsHtml);
		

		// 自定义样式字段的设置
		html = "";
		for(var i = 0; i < fields.length;++i){
			field = fields[i];
			if(field != null){
				name = field.name;
				html += "<option value='" + name + "'>" + name + "</option>";
			}
		}
		this.panel.find(".custom-pane .layer-fields").html(html);

		// 点密度样式的设置
		html = "";
		html = null;
		var type = null;
		for(var i = 0; i < fields.length; ++i){
			field = fields[i];
			type = field.type;
			if(type == "int" || type == "double" || type == "float"){
				name = field.name;
				html += "<option value='" + name + "'>" + name + "</option>";
			}
		}
		this.panel.find(".dot-density-pane .layer-fields").html(html);
	},

	//色阶地图
	getColorMaps_callback : function(colorMaps){
		if(colorMaps == null){
			return;
		}
		var dialog = MapCloud.styleManager_dialog;
		var panel = dialog.panel;
		var colorMap = null;
		var url = null;
		var html = "";
		for(var i = 0; i < colorMaps.length; ++i){
			colorMap = colorMaps[i];
			url = colorMap.url;
			html += "<li cid='" + colorMap.id + "'>"
				+ 	"	<div class='color-ramp-item' style='background-image:"
				+ 	"	url(" + url + ")'>"
				+ 	"	</div>"
				+	"</li>"
		}
		panel.find(".color-ramp-div ul").html(html);

		colorMap = colorMaps[0];
		if(colorMap != null){
			url = colorMap.url;
			var id = colorMap.id;
			var htmlSel = "<li cid='" + id + "'>"
				+ 	"	<div class='color-ramp-item' style='background-image:"
				+ 	"	url(" + url + ")'>"
				+ 	"	</div>"
				+	"</li>";
			panel.find(".select-color-ramp").html(htmlSel);
			if(dialog.uniqueValues == null){

			}
		}
		
		// 唯一值页面
		// dialog.panel.find(".select-color-ramp")
		dialog.panel.find(".unique-pane .color-ramp-div ul li").click(function(){
			var id = $(this).attr("cid");
			var uniquePanel = panel.find(".unique-pane");
			uniquePanel.find(".select-color-ramp li").attr("cid",id);
			var backgroundUrl = $(this).find(".color-ramp-item").css("background-image");
			uniquePanel.find(".select-color-ramp li .color-ramp-item").css("background-image",backgroundUrl);
			if(dialog.uniqueValues == null){
				var field = uniquePanel.find(".layer-fields option:selected").val();
				if(field == null){
					return;
				}
				dialog.wfsWorkspace.getValue(dialog.typeName,field,
							mapObj.name,
							dialog.getValuesCallback);
			}else{
				var count = dialog.uniqueValues.length;
				styleManager.getColorMap(id,count,
						dialog.getColorMap_callback)
			}
		});
		
		// 分级样式
		dialog.panel.find(".quantities-pane .color-ramp-div ul li").click(function(){
			var id = $(this).attr("cid");
			var quantitiesPanel = panel.find(".quantities-pane");
			quantitiesPanel.find(".select-color-ramp li").attr("cid",id);
			var backgroundUrl = $(this).find(".color-ramp-item").css("background-image");
			quantitiesPanel.find(".select-color-ramp li .color-ramp-item").css("background-image",backgroundUrl);
			var field = quantitiesPanel.find(".layer-fields option:selected").val();
			if(field == null || field == "none"){
				return;
			}
			if(dialog.minMaxValue == null){
				dialog.wfsWorkspace.getMinMaxValue(dialog.typeName,
					field, mapObj.name,dialog.getMinMaxValue_callback);
			}else{
				var count = dialog.panel.find(".quantities-pane .classes option:selected").val();
				styleManager.getColorMap(id,count,
					dialog.getColorMapMinMax_callback);
			}
		});

		// 自定义样式
		dialog.panel.find(".custom-pane .color-ramp-div ul li").click(function(){
			var id = $(this).attr("cid");
			var customPanel = panel.find(".custom-pane");
			customPanel.find(".select-color-ramp li").attr("cid",id);
			var backgroundUrl = $(this).find(".color-ramp-item").css("background-image");
			customPanel.find(".select-color-ramp li .color-ramp-item").css("background-image",backgroundUrl);
			var count = dialog.customStyleFilters.length;
			styleManager.getColorMap(id,count,dialog.getColorMapCustom_callback);
		});
	},

	// 所有值的结果
	getValuesCallback : function(values){
		if(values == null){
			return;
		}

		var count = values.length;
		var dialog = MapCloud.styleManager_dialog;
		var panel = dialog.panel;
		dialog.uniqueValues = values;
		var id = panel.find(".unique-pane .select-color-ramp li").attr("cid");
		styleManager.getColorMap(id,count,
			dialog.getColorMap_callback);
	},

	// 获得一个色阶的色阶值
	getColorMap_callback : function(colors){
		if(colors == null){
			return;
		}
		var dialog = MapCloud.styleManager_dialog;
		var panel = dialog.panel;

		// var defaultRule = dialog.defaultStyle.rules[0];
		if(dialog.singleStyle == null){
			MapCloud.notify.showInfo("请设置一个有效样式","Warning");
			return;
		}
		var defaultRule = dialog.singleStyle.rules[0];
		var field = dialog.panel.find(".unique-pane .layer-fields option:selected").val();
		var values = dialog.uniqueValues;
		var style = dialog.getStyleByValues(defaultRule,field,values,colors);
		dialog.uniqueStyle = style;
		if(style != null){
			dialog.displayUniqueStyle(dialog.uniqueStyle);
		}
	},

	// 最大最小值
	getMinMaxValue_callback : function(obj){
		if(obj == null){
			return;
		}
		var min = obj.min;
		var max = obj.max;
		var dialog = MapCloud.styleManager_dialog;
		dialog.minMaxValue = obj;

		// 设置分级数
		var classesOption = dialog.panel.find(".quantities-pane .classes option:selected");
		// classesOption.attr("selected",true);
		// var classes = 5;
		var classes = classesOption.val();
		
		// 获得色阶值
		var id = dialog.panel.find(".quantities-pane .select-color-ramp li").attr("cid");
		styleManager.getColorMap(id,classes,
			dialog.getColorMapMinMax_callback);
		// var classes = dialog.panel.find(".quantities-pane .classes option:selected").val();

	},
	// 分级样式的颜色色阶值
	getColorMapMinMax_callback : function(colors){
		if(colors == null){
			return;
		}
		var dialog = MapCloud.styleManager_dialog;
		if(dialog.singleStyle == null){
			MapCloud.notify.showInfo("请设置一个有效样式","Warning");
			return;
		}
		var defaultRule = dialog.singleStyle.rules[0];
		var classes = dialog.panel.find(".quantities-pane .classes option:selected").val();
		
		var min = dialog.minMaxValue.min;
		var max = dialog.minMaxValue.max;

		var field = dialog.panel.find(".quantities-pane .layer-fields option:selected").val();
		var style = dialog.getStyleByMinMaxValues(defaultRule,field,min,max,classes,colors);
		dialog.quantitiesStyle = style;
		dialog.displayQuantitiesStyle(dialog.quantitiesStyle);
	},

	// 根据最大最小值获得样式
	getStyleByMinMaxValues : function(defaultRule,field,min,max,classes,colorValues){
		if(defaultRule == null || min == null || max == null || classes == null){
			return null;
		}

		var geomType = this.singleStyle.geomType;
		var style = new GeoBeans.Style.FeatureStyle("quantities",geomType);
		style.styleClass = GeoBeans.Style.FeatureStyle.StyleClass.QUANTITIES;
		var rules = [];

		var defaultSymbolizer = defaultRule.symbolizer;
		var type = defaultSymbolizer.type;
		var defaultTextSymbolizer = defaultRule.textSymbolizer;
		var colorValue = null;

		// var interval = (max - min)/(classes-1);
		var interval = (max - min)/classes;
		for(var i = 0; i < classes; ++i){
			var lower = min + interval * i;
			var upper = min + interval * (i+1);
			var rule = new GeoBeans.Rule();

			colorValue = colorValues[i];

			var symbolizer = defaultSymbolizer.clone();
			if(type == GeoBeans.Symbolizer.Type.Point){
				var opacity = symbolizer.fill.getOpacity();
				color = new GeoBeans.Color();
				color.setByHex(colorValue,opacity);
				symbolizer.fill.color = color;
			}else if(type == GeoBeans.Symbolizer.Type.Line){
				var opacity = symbolizer.stroke.getOpacity();
				color = new GeoBeans.Color();
				color.setByHex(colorValue,opacity);
				symbolizer.stroke.color = color;
			}else if(type == GeoBeans.Symbolizer.Type.Polygon){
				var opacity = symbolizer.fill.getOpacity();
				color = new GeoBeans.Color();
				color.setByHex(colorValue,opacity);
				symbolizer.fill.color = color;
			}

			rule.symbolizer = symbolizer;

			if(defaultTextSymbolizer != null){
				rule.textSymbolizer = defaultTextSymbolizer;
			}

			var filter = new GeoBeans.IsBetweenFilter();
			var propertyName = new GeoBeans.PropertyName();
			propertyName.name = field;
			var lowerLiteral = new GeoBeans.Literal();
			lowerLiteral.value = lower;
			var upperLiteral = new GeoBeans.Literal();
			upperLiteral.value = upper;

			filter.expression = propertyName;
			filter.lowerBound = lowerLiteral;
			filter.upperBound = upperLiteral;
			rule.filter = filter;

			rule.name = i;
			rules.push(rule);
		}

		style.rules = rules;
		return style;
	},

	//根据图层的样式，来获取style的样式
	getStyleTypeByGeomType : function(geomType){
		if(geomType == null){
			return null;
		}
		geomType = geomType.toUpperCase();
		var styleGeomType = null;
		switch(geomType){
			case "POINT":
			case "MULTIPOINT":{
				styleGeomType = GeoBeans.Style.FeatureStyle.GeomType.Point;
				break;
			}
			case "LINESTRING":
			case "MULTILINESTRING":{
				styleGeomType = GeoBeans.Style.FeatureStyle.GeomType.LineString;
				break;
			}
			case "POLYGON":
			case "MULTIPOLYGON":{
				styleGeomType = GeoBeans.Style.FeatureStyle.GeomType.Polygon;
				break;
			}
			default:
				break;
		}
		return styleGeomType;
	},

	// 生成style,包含筛选的条件,添加所有值后的样式
	getStyleByValues : function(defaultRule,field,values,colorValues){
		var color = null;
		var index = null;
		var colorValue = null;
		var defaultSymbolizer = defaultRule.symbolizer;
		var defaultTextSymbolizer = defaultRule.textSymbolizer;

		var colorValuesLength = colorValues.length;
		var type = defaultSymbolizer.type;
		var geomType = this.singleStyle.geomType;
		var styleName = this.panel.find("#style_list option:selected")
					.text();
		var style = new GeoBeans.Style.FeatureStyle("unique",geomType);
		style.styleClass = GeoBeans.Style.FeatureStyle.StyleClass.UNIQUE;
		var rules = [];


		// 根据所有值,生成每一个rule
		for(var i = 0; i < values.length; ++i){
			var value = values[i];
			var rule = new GeoBeans.Rule();
			
			colorValue = colorValues[i];

			var symbolizer = defaultSymbolizer.clone();
			if(type == GeoBeans.Symbolizer.Type.Point){
				var opacity = symbolizer.fill.getOpacity();
				color = new GeoBeans.Color();
				color.setByHex(colorValue,opacity);
				symbolizer.fill.color = color;
			}else if(type == GeoBeans.Symbolizer.Type.Line){
				var opacity = symbolizer.stroke.getOpacity();
				color = new GeoBeans.Color();
				color.setByHex(colorValue,opacity);
				symbolizer.stroke.color = color;
			}else if(type == GeoBeans.Symbolizer.Type.Polygon){
				var opacity = symbolizer.fill.getOpacity();
				color = new GeoBeans.Color();
				color.setByHex(colorValue,opacity);
				symbolizer.fill.color = color;
			}

			rule.symbolizer = symbolizer;

			var filter = new GeoBeans.BinaryComparisionFilter();
			var propertyName = new GeoBeans.PropertyName();
			propertyName.name = field;
			var literal = new GeoBeans.Literal();
			literal.value = value;
			filter.operator = GeoBeans.ComparisionFilter.OperatorType.ComOprEqual;
			filter.expression1 = propertyName;
			filter.expression2 = literal;

			rule.filter = filter;
			rule.name = i;

			if(defaultTextSymbolizer != null){
				rule.textSymbolizer = defaultTextSymbolizer;
			}

			rules.push(rule);
		}
		style.rules = rules;
		return style;
	},

	// 设置样式
	setStyle : function(typeName,style){
		if(typeName == null || style == null){
			return;
		}
		mapObj.setStyle(typeName,style,this.setStyle_callback);
	},

	// 设置样式结果
	setStyle_callback : function(result){
		var info = "设置样式";
		MapCloud.notify.showInfo(result,info);
		mapObj.draw();
	},

	// 设置符号
	setSymbol : function(symbol){
		if(symbol == null){
			return;
		}
		var url = "url(" + symbol.icon + ")";

		if(this.symbolChangedClass == GeoBeans.Style.FeatureStyle.StyleClass.SINGLE 
			&& this.symbolChangedIndex == 0){
			this.panel.find(".single-pane .symbol-icon").css("background-image",url);
			if(this.singleStyle != null){
				this.singleStyle.rules[0].symbolizer.symbol = symbol;
			}
		}else if(this.symbolChangedClass == GeoBeans.Style.FeatureStyle.StyleClass.UNIQUE){
			var symbolIcon = this.panel.find(".unique-pane .symbol-icon")[this.symbolChangedIndex];
			$(symbolIcon).css("background-image",url);
			if(this.uniqueStyle != null){
				this.uniqueStyle.rules[this.symbolChangedIndex].symbolizer.symbol = symbol;
			}
		}else if(this.symbolChangedClass == GeoBeans.Style.FeatureStyle.StyleClass.QUANTITIES){
			var symbolIcon = this.panel.find(".quantities-pane .symbol-icon")[this.symbolChangedIndex];
			$(symbolIcon).css("background-image",url);
			if(this.quantitiesStyle != null){
				this.quantitiesStyle.rules[this.symbolChangedIndex].symbolizer.symbol = symbol;
			}
		}else if(this.symbolChangedClass == GeoBeans.Style.FeatureStyle.StyleClass.CUSTOM){
			var symbolIcon = this.panel.find(".custom-pane .symbol-icon")[this.symbolChangedIndex];
			$(symbolIcon).css("background-image",url);
			if(this.customStyle != null){
				this.customStyle.rules[this.symbolChangedIndex].symbolizer.symbol = symbol;
			}
		}
	},

	// 根据样式的类型返回符号的类型
	getSymbolIconType : function(symbolizerType){
		var type = null;
		switch(symbolizerType){
			case GeoBeans.Symbolizer.Type.Point:{
				type = "marker";
				break;
			}
			case GeoBeans.Symbolizer.Type.Line:{
				type = "line";
				break;
			}
			case GeoBeans.Symbolizer.Type.Polygon:{
				type = "fill";
				break;
			}
			default:
				break;
		}
		return type;
	},

	// 获取表达式
	getSqlExpression : function(filter){
		if(filter == null){
			return;
		}
		var  sql = null;
		if(filter instanceof GeoBeans.ComparisionFilter){
			var operator = filter.operator;

			if(operator == GeoBeans.ComparisionFilter.OperatorType.ComOprIsBetween){
				var expression = filter.expression;
				var lowerBound = filter.lowerBound;
				var upperBound = filter.upperBound;
				if(expression == null || lowerBound == null || upperBound == null){
					return null;
				}
				var field = expression.name;
				var min = lowerBound.value;
				var max = upperBound.value;
				if(field == null || min == null || max == null){
					return null;
				}
				sql = min + " &lt; " + field + " &lt; " + max;
			}else{
				var expression1 = filter.expression1;
				var expression2 = filter.expression2;
				if(expression1 == null || expression2 == null){
					return null;
				}
				var field = null, value = null;
				if(expression1.type == GeoBeans.Expression.Type.PropertyName){
					field = expression1.name;
				}else if(expression1.type == GeoBeans.Expression.Type.Literal){
					value = expression1.value;
				}
				if(expression2.type == GeoBeans.Expression.Type.PropertyName){
					field = expression2.name;
				}else if(expression2.type == GeoBeans.Expression.Type.Literal){
					value = expression2.value;
				}
				var oper = this.getOperatorExpression(operator);
				if(oper == null || field == null || value == null){
					return null;
				}
				sql = field + " " + oper + " " + value;
			}
		}
		return sql;
	},

	getOperatorExpression : function(operator){
		var oper = null;
		switch(operator){
			case GeoBeans.ComparisionFilter.OperatorType.ComOprEqual:{
				oper = "=";
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprGreaterThan:{
				oper = ">";
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprGreaterThanOrEqual:{
				oper = ">=";
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprLessThan:{
				oper = "<";
				break;
			}
			case GeoBeans.ComparisionFilter.OperatorType.ComOprLessThanOrEqual:{
				oper = "<=";
				break;
			}
			default:{
				oper = null;
				break;
			}
		}
		return oper;
	},

	// 设定一个filter
	setCustomFilter : function(filter){
		if(filter == null){
			return;
		}
		var name = filter.name;
		if(name == null){
			this.customStyleFilters.push(filter);
		}else{
			for(var i = 0; i < this.customStyleFilters.length; ++i){
				if(name == this.customStyleFilters[i].name){
					this.customStyleFilters[i] = filter;
					break;
				}
			}
		}
		// 获取色阶
		var id = this.panel.find(".custom-pane .select-color-ramp li").attr("cid");
		var count = this.customStyleFilters.length;
		styleManager.getColorMap(id,count,this.getColorMapCustom_callback);
	},

	getColorMapCustom_callback : function(colors){
		if(colors == null){
			return;
		}
		var dialog = MapCloud.styleManager_dialog;
		var defaultRule = dialog.singleStyle.rules[0];
		var filters = dialog.customStyleFilters;
		var style = dialog.getCustomStyle(defaultRule,filters,colors);
		dialog.customStyle = style;
		dialog.displayCustomStyle(dialog.customStyle);

	},

	getCustomStyle : function(defaultRule,filters,colorValues){
		if(defaultRule == null || filters == null || colorValues == null){
			return null;
		}
		var color = null;
		var index = null;
		var defaultSymbolizer = defaultRule.symbolizer;
		var defaultTextSymbolizer = defaultRule.textSymbolizer;

		var geomType = this.singleStyle.geomType;
		var type = defaultSymbolizer.type;
		var style = new GeoBeans.Style.FeatureStyle("custom",geomType);
		style.styleClass = GeoBeans.Style.FeatureStyle.StyleClass.CUSTOM;

		var rules = [];
		var colorValue = null;

		for(var i = 0; i < colorValues.length; ++i){
			colorValue = colorValues[i];
			var rule = new GeoBeans.Rule();
			var filter = filters[i];
			var symbolizer = defaultSymbolizer.clone();

			if(type == GeoBeans.Symbolizer.Type.Point){
				var opacity = symbolizer.fill.getOpacity();
				color = new GeoBeans.Color();
				color.setByHex(colorValue,opacity);
				symbolizer.fill.color = color;
			}else if(type == GeoBeans.Symbolizer.Type.Line){
				var opacity = symbolizer.stroke.getOpacity();
				color = new GeoBeans.Color();
				color.setByHex(colorValue,opacity);
				symbolizer.stroke.color = color;
			}else if(type == GeoBeans.Symbolizer.Type.Polygon){
				var opacity = symbolizer.fill.getOpacity();
				color = new GeoBeans.Color();
				color.setByHex(colorValue,opacity);
				symbolizer.fill.color = color;
			}
			rule.symbolizer = symbolizer;
			rule.filter = filter;
			rule.name = i;

			if(defaultTextSymbolizer != null){
				rule.textSymbolizer = defaultTextSymbolizer;
			}

			rules.push(rule);
		}

		style.rules = rules;
		return style;
	},

	// 获得显示样式分类
	getRulesHtml : function(rules){
		if(rules == null){
			return;
		}
		var html = "<thead>"
				+  "	<tr>"
				+ "			<th class='style-col'><span>&nbsp;</span></th>"
				+ "			<th class='style-col'><span>&nbsp;</span></th>"
				+  "		<th class='value-col'>表达式</th>"
				+  "		<th class='value-col'>表达式</th>"
				+  "	</tr>"
				+  "</thead>"
				+  "<tbody>";
		var rule = null;
		for(var i = 0; i < rules.length; ++i){
			rule = rules[i];
			var filter = rule.filter;
			if(filter == null){
				continue;
			}
			var sqlExpression = this.getSqlExpression(filter);
			var symbolizer = rule.symbolizer;
			var symbolHtml = this.getSymbolHtml(symbolizer);
			var symbolIconHtml = this.getSymbolIconHtml(symbolizer.type,symbolizer.symbol);
			html += "<tr>"
				+ "		<td class='style-col'>"
				+ 			symbolHtml
				+ "		</td>"
				+ "		<td class='style-col'>"
				+ 			symbolIconHtml
				+ "		</td>"
				+ "		<td class='value-col'>"
				+ 			sqlExpression 
				+ "		</td>"
				+ "		<td value='value-col'>"
				+ 			sqlExpression
				+ "		</td>"
				+ "	</tr>";
		}
		html += "</tbody>";
		return html;
	},

	// 根据自定义条件获取filter
	getCustomStyleFilters : function(style){
		if(style == null){
			return [];
		}
		var rules = style.rules;
		if(rules == null){
			return [];
		}
		var filters = [];
		for(var i = 0; i < rules.length; ++i){
			var rule = rules[i];
			if(rule != null){
				filters.push(rule.filter);
			}
		}
		return filters;
	}
});