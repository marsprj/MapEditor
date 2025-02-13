MapCloud.ChartPanel = MapCloud.Class(MapCloud.Panel,{
	// 图
	chartLayer 	: null,

	// 数据库
	dbName 		: null,

	// 表格名称
	tableName 	: null,

	// 样式管理器
	styleMgr 	: null,

	initialize : function(id){
		MapCloud.Panel.prototype.initialize.apply(this,arguments);
		this.panel.find("#chart_accordion").collapse();
		
		this.registerEvent();
	},

	showPanel : function(){
		if(this.panel.css("display") == "none"){
			this.cleanup();
			this.panel.css("display","block");
			this.panel.find(".panel-collapse").each(function(){
				if($(this).hasClass("in")){
					$(this).collapse("hide");
				}
			});
			var firstPanel = this.panel.find(".panel-collapse").first();
			if(!firstPanel.hasClass("in")){
				firstPanel.collapse("show");
			}
			this.showLayersTab();
			var colors = styleManager.getColorMaps();
			this.getColorMaps_callback(colors);
		}
	},

	hidePanel : function(){
		MapCloud.Panel.prototype.hidePanel.apply(this,arguments);
		MapCloud.refresh_panel.refreshPanel();
	},


	cleanup : function(){
		this.chartLayer = null;
		this.dbName = null;
		this.tableName = null;
		this.panel.find(".chart-table").val("");
		this.panel.find(".chart-table-fields").empty();
		this.panel.find(".chart-base-layer").empty();
		this.panel.find(".chart-base-layer-fields").empty();
		this.panel.find(".chart-table-name").val("分级图");
		this.panel.find("#chart_style_fields").empty();
		this.panel.find("input.slider").slider("setValue",100);
		this.panel.find("#chart_style_border_opacity").html("1");
		this.panel.find("#chart_style_opacity").html("1");
	},

	// 返回选择要展示的图表
	setDataSet : function(dbName,tableName){

		this.dbName = dbName;
		this.tableName = tableName;

		this.panel.find(".chart-table").val(this.tableName);
		this.showTableFields(this.dbName,this.tableName);
	
	},
	// 注册各个选择事件
	registerEvent : function(){
		var that = this;

		// 选择图表
		this.panel.find(".btn-chose-chart").click(function(){
			MapCloud.vector_db_dialog.showDialog("range");
		});

		// 表格匹配字段
		this.panel.find(".chart-table-fields").change(function(){
			var value = $(this).val();
			if(that.chartLayer != null){
				that.chartLayer.setTableField(value);
			}
		});

		// 切换底图
		this.panel.find(".chart-base-layer").change(function(){
			var value = $(this).val();
			that.showBaseLayerFields(value);
			if(that.chartLayer != null){
				that.chartLayer.setBaseLayer(value);
			}
		});

		// 切换底图关联字段
		this.panel.find(".chart-base-layer-fields").change(function(){
			var value = $(this).val();
			if(that.chartLayer != null){
				that.chartLayer.setBaseLayerField(value);
			}
		});

		// 切换字段
		this.panel.find("#chart_style_fields").change(function(){
			var value = $(this).val();
			if(that.chartLayer != null){
				that.chartLayer.setChartFields([value]);
			}
		});


		//关闭
		this.panel.find(".btn-cancel").click(function(){
			that.hidePanel();
		});

		// 增加
		this.panel.find(".btn-add-chart").click(function(){
			if(that.chartLayer == null){
				that.addChart();
			}else{
				// 修改
				that.changeChartOption();
			}
			MapCloud.refresh_panel.refreshPanel();
		});

		// fill 拖动条
		this.panel.find(".form-group-fill-opacity .slider").each(function(){
			$(this).slider({
				tooltip : 'hide'
			});
			$(this).on("slide",function(slideEvt){
				var opacity = slideEvt.value;
				that.panel.find("#chart_style_opacity").html(opacity/100);
				// that.changeStyleByOpactiy(opacity/100);
				// that.panel.find(".form-group-style .colorSelector div").css("opacity",opacity/100);
				// that.displayStyle(that.style);
			});
		});

		// border 拖动条
		this.panel.find(".form-group-border .slider").each(function(){
			$(this).slider({
				tooltip : 'hide'
			});
			$(this).on("slide",function(slideEvt){
				var opacity = slideEvt.value;
				that.panel.find("#chart_style_border_opacity").html(opacity/100);
				// var color = that.panel.find(".form-group-border .colorSelector div")
				// 				.css("background-color");
				// that.panel.find(" .form-group-border .colorSelector div").css("opacity",opacity/100);
				// that.changeStyleByBorder(color,opacity/100);
				// that.displayStyle(that.style);
			});
		});	

		// 边界
		this.panel.find(".form-group-border .colorSelector").each(function(){
			$(this).colpick({
				color:'cccccc',
				onChange:function(hsb,hex,rgb,el,bySetColor) {
					$(el).children().css("background-color","#" + hex);
					// var opacity = $(el).children().css("opacity");
					// that.changeStyleByBorder($(el).children().css("background-color"),opacity);
					// that.displayStyle(that.style);
				},
				onSubmit:function(hsb,hex,rgb,el,bySetColor){
					$(el).children().css("background-color","#" + hex);
					$(el).colpickHide();
					// var opacity = $(el).children().css("opacity");
					// that.changeStyleByBorder($(el).children().css("background-color"),opacity);
					// that.displayStyle(that.style);
				}
			});
			$(this).colpickSetColor("#ccc");
			$(this).find("div").css("background-color","#ccc");
		});


		// 双击变悬浮框
		this.panel.find(".panel-header").dblclick(function(){
			that.panel.css("display","none");
			MapCloud.tools.showToolBox("chart");
		});

	},

	// 展示底图
	showLayersTab : function(){
		this.showBaseLayer();
		this.showLabelLayer();
	},

	// 底图
	showBaseLayer : function(){
		if(mapObj == null){
			return;
		}
		var layers = mapObj.getLayers();
		var layer = null;
		var name = null;
		var html = "";
		for(var i = 0; i < layers.length; ++i){
			layer = layers[i];
			if(layer instanceof GeoBeans.Layer.DBLayer && 
				(layer.geomType == GeoBeans.Geometry.Type.POLYGON
				|| layer.geomType == GeoBeans.Geometry.Type.MULTIPOLYGON)){
				name = layer.name;
				html += "<option value='" + name + "'>" 
				+ name + "</option>";
			}
		}
		this.panel.find(".chart-base-layer").html(html);


		var value = this.panel.find(".chart-base-layer").val();
		this.showBaseLayerFields(value);
	},

	// 展示底图字段
	showBaseLayerFields : function(layerName){
		var layer = mapObj.getLayer(layerName);
		if(layer == null){
			return;
		}
		var fields = layer.getFields();
		if(fields == null){
			return;
		}
		var field = null;
		var name = null;
		var html = "";
		for(var i = 0; i < fields.length; ++i){
			field = fields[i];
			if(field == null){
				continue;
			}
			name = field.name;
			html += "<option value ='" + name + "'>"
			+ name + "</option>";
		}
		this.panel.find(".chart-base-layer-fields").html(html);
	},

	// 标注层
	showLabelLayer : function(){
		if(mapObj == null){
			return;
		}
		var layers = mapObj.getLayers();
		var layer = null;
		var name = null;
		var html = "";
		for(var i = 0; i < layers.length; ++i){
			layer = layers[i];
			if(layer instanceof GeoBeans.Layer.DBLayer && 
				(layer.geomType == GeoBeans.Geometry.Type.POINT
				|| layer.geomType == GeoBeans.Geometry.Type.MULTIPOINT)){
				name = layer.name;
				html += "<option value='" + name + "'>" 
				+ name + "</option>";
			}
		}
		this.panel.find(".chart-label-layer").html(html);


		var value = this.panel.find(".chart-label-layer").val();
		this.showLabelLayerFields(value);
	},

	// 标注层字段
	showLabelLayerFields : function(layerName){
		var layer = mapObj.getLayer(layerName);
		if(layer == null){
			return;
		}
		var fields = layer.getFields();
		if(fields == null){
			return;
		}
		var field = null;
		var name = null;
		var html = "";
		for(var i = 0; i < fields.length; ++i){
			field = fields[i];
			if(field == null){
				continue;
			}
			name = field.name;
			html += "<option value ='" + name + "'>"
			+ name + "</option>";
		}
		this.panel.find(".chart-label-layer-fields").html(html);
	},

	// 选择的图表的字段
	showTableFields : function(db,table){
		var workspace = new GeoBeans.WFSWorkspace("tmp",
				mapObj.server,"1.0.0");
		var tableFeatureType = new GeoBeans.FeatureType(workspace,table);
		var fields = tableFeatureType.getFields(null,db);
		if(fields == null){
			return;
		}
		var field = null;
		var name = null;
		var html = "";
		for(var i = 0; i < fields.length; ++i){
			field = fields[i];
			if(field == null){
				continue;
			}
			name = field.name;
			html += "<option value='" + name +　"'>" + name + "</option>";
		}

		this.panel.find(".chart-table-fields").html(html);

		this.showChartFields(fields);
	},

	// 显示的字段
	showChartFields : function(fields){
		if(fields == null){
			return;
		}
		var field = null;
		var name = null;
		var type = null;
		var html = "";
		for(var i = 0; i < fields.length; ++i){
			field = fields[i];
			if(field == null){
				continue;
			}
			type = field.type;
			if(type == "double" || type == "int" || type == "float"){
				name = field.name;
				html += "<option value='" + name +"'>" 
				+ name + "</option>";
			}
			
		}
		this.panel.find("#chart_style_fields").html(html);
	},

	// 色阶地图 
	getColorMaps_callback : function(colorMaps){
		if(colorMaps == null){
			return;
		}
		
		var that = MapCloud.chart_panel;
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
		that.panel.find(".color-ramp-div ul").html(html);

		colorMap = colorMaps[0];
		if(colorMap != null){
			url = colorMap.url;
			var id = colorMap.id;
			var htmlSel = "<li cid='" + id + "'>"
				+ 	"	<div class='color-ramp-item' style='background-image:"
				+ 	"	url(" + url + ")'>"
				+ 	"	</div>"
				+	"</li>";
			that.panel.find(".select-color-ramp").html(htmlSel);
		}

		that.panel.find(".color-ramp-div ul li").click(function(){
			// that.panel.find("input.slider").slider("setValue",100);
			// that.panel.find("#chart_style_opacity").html(1);
			var id = $(this).attr("cid");
			that.panel.find(".select-color-ramp li").attr("cid",id);
			var backgroundUrl = $(this).find(".color-ramp-item").css("background-image");
			that.panel.find(".select-color-ramp li .color-ramp-item").css("background-image",backgroundUrl);
			
		});
	},


	// 添加图表
	addChart : function(){
		if(mapObj == null){
			MapCloud.notify.showInfo("当前地图为空");
			return;
		}
		var layerName = this.panel.find(".chart-base-layer").val();
		var layer = mapObj.getLayer(layerName);
		if(layer == null){
			MapCloud.notify.showInfo("选择一个有效的底图","Waring");
			return;
		}
		var chartName = this.panel.find(".chart-table-name").val();
		if(chartName == null || chartName == ""){
			MapCloud.notify.showInfo("请输入图表名称","Waring");
			return;
		}

		var baseLayerField = this.panel.find(".chart-base-layer-fields").val();
		if(baseLayerField == null || baseLayerField == ""){
			MapCloud.notify.showInfo("请选择空间字段","Warning");
			return;
		}


		var dbName = this.dbName;
		var tableName = this.tableName;
		if(dbName == null || tableName == null){
			MapCloud.notify.showInfo("请设置表格","Warning");
			return;
		}

		var tableField = this.panel.find(".chart-table-fields").val();
		if(tableField == null || tableField == ""){
			MapCloud.notify.showInfo("请设置关联字段","Warning");
			return;
		}

		var chartField = this.panel.find("#chart_style_fields").val();
		if(chartField == null || chartField == ""){
			MapCloud.notify.showInfo("请设置分级图字段","Warning");
			return;
		}

		var labelLayer = this.panel.find(".chart-label-layer").val();
		var labelLayerField = this.panel.find(".chart-label-layer-fields").val();

		var chartOption = this.getChartOption();

		var layer = new GeoBeans.Layer.RangeChartLayer(chartName,layerName,
			baseLayerField,dbName,tableName,tableField,[chartField],chartOption,
			labelLayer,labelLayerField);
		mapObj.addLayer(layer,this.addChartLayer_callback);
	},

	addChartLayer_callback : function(result){
		if(result == "success"){
			mapObj.draw();
			var that = MapCloud.chart_panel;
			var name = that.panel.find(".chart-table-name").val();
			that.chartLayer = mapObj.getLayer(name);
		}else{
			MapCloud.notify.showInfo(result,"添加分级图");
		}
	},

	// 修改了参数
	changeChartOption : function(){
		if(this.chartLayer == null){
			return;
		}
		var name = this.panel.find(".chart-table-name").val();
		if(name == null || name == ""){
			MapCloud.notify.showInfo("请输入分级图名称","Warning");
			this.panel.find(".chart-table-name").focus();
			return;
		}
		var chartOption = this.getChartOption();
		this.chartLayer.setChartOption(chartOption);
		this.chartLayer.setName(name);
		mapObj.draw();
	},

	// 获得参数
	getChartOption : function(){
		var borderColor = this.panel.find(".form-group-border .colorSelector div")
			.css("background-color");
		var color = new GeoBeans.Color();
		color.setByRgb(borderColor,1);
		var border = color.getHex();
		var borderOpacity = this.panel.find("#chart_style_border_opacity").html();

		var opacity = this.panel.find("#chart_style_opacity").html();

		var colorMapID = this.panel.find(".select-color-ramp li").attr("cid");
		var option = {
			colorMapID 		: colorMapID,
			opacity 		: opacity,
			border 			: border,
			borderOpacity	: parseFloat(borderOpacity)
		};
		return option;
	},



	// // 获取分级图的样式
	// getRangeChartStyle : function(){
	// 	var baseLayerName = this.panel.find(".chart-base-layer").val();
	// 	if(baseLayerName == null ){
	// 		return null;
	// 	}
	// 	var baseLayerField = this.panel.find(".chart-base-layer-fields").val();
	// 	if(baseLayerField == null){
	// 		return null;
	// 	}
	// 	var dbName = this.dbName;
	// 	var tableName = this.tableName;
	// 	if(dbName == null || tableName == null){
	// 		return null;
	// 	}
	// 	var tableField = this.panel.find(".chart-table-fields").val();
	// 	if(tableField == null){
	// 		return null;
	// 	}
	// 	var chartField = this.panel.find("#chart_style_fields").val();
	// 	if(chartField == null){
	// 		return null;
	// 	}
	// 	var count = this.panel.find("#chart_style_count").val();
	// 	count = parseInt(count);
	// 	if(count == null || count <= 0){
	// 		return null;
	// 	}
	// 	var colorMapID = this.panel.find(".select-color-ramp li").attr("cid");
	// 	if(colorMapID == null){
	// 		return null;
	// 	}
	// 	var style = mapObj.getRangeChartStyle(baseLayerName,baseLayerField,
	// 		dbName,tableName,tableField,chartField,count,parseInt(colorMapID));
	// 	return style;
	// },

	// 初始化
	setChartLayer : function(chartLayer){
		this.chartLayer = chartLayer;
		if(this.chartLayer == null){
			return;
		}
		var name = this.chartLayer.name;
		this.panel.find(".chart-table-name").val(name);

		// 底图设置
		var baseLayerName = this.chartLayer.getBaseLayer();
		var baseLayerField = this.chartLayer.getBaseLayerField();
		var dbName = this.chartLayer.getDbName();
		var tableName = this.chartLayer.getTableName();
		var tableField = this.chartLayer.getTableField();

		this.dbName = dbName;
		this.tableName = tableName;
		this.panel.find(".chart-table").val(this.tableName);
		this.showTableFields(this.dbName,this.tableName);
		this.panel.find(".chart-table-fields option[value='" 
				+ tableField + "']").attr("selected",true);
		this.panel.find(".chart-base-layer option[value='"
				+ baseLayerName+ "']").attr("selected",true);
		this.panel.find(".chart-base-layer-fields option[value='"
				+ baseLayerField + "']").attr("selected",true);

		// chartFields
		var chartFields = this.chartLayer.getChartFields();
		var chartField = chartFields[0];

		this.panel.find("#chart_style_fields option[value='"
			+ chartField + "']").attr("selected",true);

		// style
		// var style = this.chartLayer.getStyle();
		// this.style = style;
		// this.displayStyle(style);

		var option = this.chartLayer.getChartOption();
		var colorMapID = option.colorMapID;
		var border = option.border;
		var borderOpacity = option.borderOpacity;
		var opacity = option.opacity;

		this.panel.find(".form-group-fill-opacity input.slider")
			.slider("setValue",opacity*100);
		opacity = parseFloat(opacity);
		this.panel.find("#chart_style_opacity").html(opacity.toFixed(2));

		this.panel.find(".form-group-border input.slider")
			.slider("setValue",borderOpacity*100);
		borderOpacity = parseFloat(borderOpacity);
		this.panel.find("#chart_style_border_opacity").html(borderOpacity.toFixed(2));
		this.panel.find(".form-group-border .colorSelector")
			.colpickSetColor(border);
		var colorRgba = color.getRgba();
		this.panel.find(".form-group-border .colorSelector div")
			.css("background-color",border);
		this.panel.find(".form-group-border .colorSelector div")
			.css("opacity",borderOpacity);


		colorMapID = parseInt(colorMapID);
		this.panel.find(".select-color-ramp li").attr("cid",colorMapID);
		var li = this.panel.find(".dropdown-menu li[cid='" + colorMapID +"']");
		var backgroundUrl = li.find(".color-ramp-item").css("background-image");
		this.panel.find(".select-color-ramp li .color-ramp-item").css("background-image",backgroundUrl);
	}

});