MapCloud.SearchPanel = MapCloud.Class(MapCloud.Panel,{
	
	poiPageCount : 20,

	poiCurrentPage : null,

	trackOverlayControl : null,

	// 专题图底图
	baseLayer : "prov_bount_4m",

	// 专题图底图字段
	baseLayerField : "name",

	// 专题图所在数据库
	chartSourceName : "gisdb",

	// 专题图的空间字段
	chartPositionField : "地区",

	// 专题图配置
	chartOption : {
		colorMapID : 12,
		opacity : 0.9,
		border : "#cccccc",
		borderOpacity : 0.9
	},

	// 热力图底图
	heatLayerName : null,


	initialize : function(id){
		MapCloud.Panel.prototype.initialize.apply(this,arguments);	

		this.poiManager = user.getPoiManager();

		this.trackOverlayControl = new GeoBeans.Control.TrackOverlayControl();
		if(mapObj != null){
			mapObj.controls.add(this.trackOverlayControl);	
		}

		this.registerEvent();
		mapObj.registerOverlayEvent();
		this.showHeatMapLayers();
	},

	registerEvent : function(){
		var that = this;

		// 伸缩left panel
		this.panel.find("#map_btn").click(function(){
			var searchPanel = that.panel.find(".search-panel");
			if(searchPanel.css("width") == "0px"){
				searchPanel.css("width","269px");
				that.panel.css("width","330px");
				$(this).css("left","329px");
				$("#right_panel").css("width","calc( 100% - 330px)");
				$(this).find(".fa-angle-right").removeClass(".fa-angle-right").addClass("fa-angle-left");
			}else{
				searchPanel.css("width","0px");
				that.panel.css("width","60px");
				$(this).css("left","59px");
				$("#right_panel").css("width","calc( 100% - 60px)");
				$(this).find(".fa-angle-left").removeClass(".fa-angle-left").addClass("fa-angle-right");
			}

			searchPanel.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",
			function(){ 
				if(mapObj != null){
					mapObj.resize("width");
				}
			});		
		});


		// 切换面板
		this.panel.find(".menu li").click(function(){
			var preName = that.panel.find(".menu li.active").attr("sname");
			var sname = $(this).attr("sname");
			if(preName == sname && preName != "poi"){
				return;
			}
			that.panel.find(".menu li").removeClass("active");
			$(this).addClass("active");

			that.panel.find(".search-tab-panel").hide();
			that.panel.find(".search-tab-panel[sname='" + sname + "']").show();

			if(sname == "overlay"){
				that.showOverlayPanel();
			}else{
				mapObj.unregisterOverlayEvent();
			}

			if(sname != "chart"){
				that.removeChart();
			}
			if(sname == "poi"){
				that.showPoiPanel();
			}		
		});

		// 查看poi
		this.panel.find(".search-panel .search-btn").click(function(){
			var text = that.panel.find(".search-keyword").val();
			if(text == ""){
				MapCloud.notify.showInfo("请输入查询关键词","Warning");
				return;
			}
			that.searchPoi([text]);
		});

		// 搜索关键词
		this.panel.find(".poi-item,.poi-list-row span").click(function(){
			var poiName = $(this).attr("piname");
			var poiList = [];
			switch(poiName){
				case "hotel":{
					poiList.push("hotel");
					poiList.push("酒店");
					break;
				}
				case "embassy":{
					poiList.push("大使馆");
					break;
				}
				case "gas":{
					poiList.push("加油站");
					break;
				}
				case "train":{
					poiList.push("火车站");
					break;
				}
				case "bus":{
					poiList.push("汽车站");
					break;
				}
				case "factory":{
					poiList.push("工厂");
					break;
				}
				default:
					break;
			}
			if(poiList.length != 0){
				that.searchPoi(poiList);
			}
			
		});		
		// 显示删除按钮
		this.panel.find(".search-keyword").on("input",function(e){
			var keyword = $(this).val();
			if(keyword.length > 0){
				that.panel.find(".remove-poi-search").show();
			}else{
				that.panel.find(".remove-poi-search").hide();
			}
		});

		// 删除搜索结果
		this.panel.find(".remove-poi-search").click(function(){
			$(this).hide();
			that.clearPoiSearch();
		});

		// 开始标注
		this.panel.find(".overlay-panel .current-layer-row").click(function(){
			that.startDrawOverlay();
		});

		// 清空overlays
		this.panel.find(".remove-overlays").click(function(){
			if(!confirm("确定删除所有标注吗?")){
				return;
			}

			mapObj.clearOverlays();
			var overlays = mapObj.getOverlays();
			that.showOverlaysList(overlays);
		});

		// 删除overlay
		this.panel.find('.remove-overlay').click(function(){
			if(!confirm("确定删除该标注吗?")){
				return;
			}
			that.editOverlay.endEdit();
			mapObj.removeOverlayObj(that.editOverlay);
			that.editOverlay = null;
			that.panel.find(".overlay-tab-panel").hide();
			that.panel.find(".overlay-list-tab").show();
			var overlays = mapObj.getOverlays();
			that.showOverlaysList(overlays);		
		});

		// 返回overlay list
		this.panel.find(".return-overlay-list").click(function(){
			that.editOverlay.endEdit();
			that.editOverlay = null;
			that.panel.find(".overlay-tab-panel").hide();
			that.panel.find(".overlay-list-tab").show();
			var overlays = mapObj.getOverlays();
			that.showOverlaysList(overlays);		
		});

		// 保存overlay
		this.panel.find(".save-overlay").click(function(){
			that.editOverlay.removeKeys();
			var name = that.panel.find("#overlay_edit_name").val();
			that.panel.find("#overlay_edit_values_row li").each(function(){
				var key = $(this).find(".overlay_key input").val();
				var value = $(this).find(".overlay_value input").val();
				that.editOverlay.addKeyValue(key,value);
			});
			that.editOverlay.name = name;
			that.editOverlay.endEdit();
			that.editOverlay = null;
			var overlays = mapObj.getOverlays();
			that.showOverlaysList(overlays);			
		});

		// 专题图
		var that = this;
		this.panel.find(".chart-item").click(function(){
			var cname = $(this).attr('cname');
			var listDiv = that.panel.find(".chart-item-list[cname='" + cname + "']");
			if(listDiv.css("display") == "block"){
				listDiv.slideUp();
			}else{
				listDiv.slideDown();
			}
		});


		this.panel.find(".chart-item-list .row").click(function(){
			var cname = $(this).parents(".chart-item-list").attr("cname");
			var index = $(this).attr("findex");
			var chartName = null,chartField = null;
			that.panel.find(".chart-item-list .row").removeClass("active");
			$(this).addClass("active");
			switch(cname){
				case "jumin":{
					chartName = "jumin";
					switch(index){
						case "1":{
							chartField = "居民人均可支配收入_元";
							break;
						}
						case "2":{
							chartField = "居民人均可支配收入_同比增长";
							break;
						}
						case "3":{
							chartField = "城镇居民人均可支配收入_元";
							break;
						}
						case "4":{
							chartField = "城镇居民人均可支配收入_同比增长";
							break;
						}
						case "5":{
							chartField = "农村居民人均可支配收入_元";
							break;
						}
						case "6":{
							chartField = "农村居民人均可支配收入_同比增长";
							break;
						}
						case "7":{
							chartField = "居民人均消费支出_元";
							break;
						}
						case "8":{
							chartField = "居民人均消费支出_同比增长";
							break;
						}
						default:
							break;
					}
					break;
				}
				case "nongye":{
					chartName = "nongye";
					switch(index){
						case "1":{
							chartField = "粮食产量_万吨";
							break;
						}
						case "2":{
							chartField = "蔬菜产量_万吨";
							break;
						}
						case "3":{
							chartField = "糖料产量_万吨";
							break;
						}
						default:
							break;
					}
					break;
				}
				case "gongye":{
					chartName = "gongye";
					switch(index){
						case "1":{
							chartField = "钢材产量_万吨";
							break;
						}
						case "2":{
							chartField = "水泥产量_万吨";
							break;
						}
						case "3":{
							chartField = "发电量_亿千瓦小时";
							break;
						}
						default:
							break;
					}
				}
				default:
					break;
			}
			if(chartName != null && chartField != null){
				mapObj.removeLayer("chart");
				var layer = new GeoBeans.Layer.RangeChartLayer("chart",that.baseLayer,
					that.baseLayerField,that.chartSourceName,chartName,that.chartPositionField,
					[chartField],that.chartOption);
				mapObj.addLayer(layer,null);
				mapObj.zoomToLayer(that.baseLayer);
			}
		});

		// 清空chart
		this.panel.find(".remove-chart").click(function(){
			that.removeChart();
		});

		// 专题图伸缩
		this.panel.find(".chart-panel .link").click(function(){
			var submenu = $(this).next();
			var li = $(this).parent();
			if(submenu.css("display") == "none"){
				that.panel.find(".chart-panel li.open").removeClass("open");
				li.addClass("open");
				that.panel.find(".chart-panel .submenu").slideUp();
				submenu.slideDown();
			}else{
				that.panel.find(".chart-panel li.open").removeClass("open");
				that.panel.find(".chart-panel .submenu").slideUp();

			}
		});

		// 增加热力图
		this.panel.find(".heatmap-submenu button").click(function(){
			that.removeChart();
			var layerName = $(this).parent().find("select").val();
			if(layerName == null || layerName == ""){
				return;
			}
			that.heatLayerName = layerName;
			var layer = mapObj.getLayer(layerName);
			if(!layer.visible){
				layer.setVisiable(true);
			}
			mapObj.addHeatMap(layerName,null,"1");
			mapObj.draw();
			MapCloud.mapLayersPanel.showLayers();
			// mapObj.zoomToLayer(layerName);
		});

		// 透明度
		this.panel.find(".slider").each(function(){
			$(this).slider({
				tooltip : 'hide'
			});
			$(this).on("slide",function(slideEvt){
				var opacity = slideEvt.value;
				that.panel.find(".chart-opacity").html(opacity/100);
				// that.changeOpacity(opacity/100);
				// that.changeDisplayOpacity();
				// that.displayChartFields();
			});
		});

		// 天津定制第一个面板
		this.panel.find(".panel-collapse:not(:eq(0))").each(function(){
			if($(this).hasClass("in")){
				$(this).collapse("hide");
			}
		});
		var firstPanel = this.panel.find(".panel-collapse").first();
		if(!firstPanel.hasClass("in")){
			firstPanel.collapse("show");
		}
	},

	// 显示查询面板
	showPoiPanel : function(){
		this.panel.find(".result-tab-div").hide();
		this.panel.find(".poi-tab").show();
		this.panel.find(".result-main-div").empty();
		mapObj.clearOverlays();
	},

	searchPoi : function(keyword){
		if(keyword == null){

			return;
		}
		this.panel.find(".result-tab-div").hide();
		this.panel.find(".result-main-div").show();
		this.keyword = keyword;
		this.poiCurrentPage = 0;
		this.searchPoiByPage(keyword,this.poiCurrentPage);
	},

	searchPoiByPage : function(keyword,page){
		if(page < 0 || keyword == null){
			return;
		}
		this.panel.find(".result-content-div .pagination").remove();
		this.panel.find(".result-main-div").empty();
		mapObj.clearOverlays();
		var offset = page * this.poiPageCount;
		this.poiManager.getPoi(keyword,this.poiPageCount,offset,null,this.searchPoi_callback);
	},	

	searchPoi_callback : function(features){
		if(!$.isArray(features)){
			return;
		}
		var that = MapCloud.searchPanel;
		that.showPoiResults(features);
		that.showPoiInMap(features);
	},

	showPoiResults : function(pois){
		if(pois == null){
			return;
		}
		var html = "<ul>";
		var poi = null, name = null, x = null,y = null,address = null;
		for(var i = 0; i < pois.length; ++i){
			poi = pois[i];
			if(poi == null){
				continue;
			}
			name = poi.name;
			x = poi.x;
			y = poi.y;
			x = parseFloat(x);
			y = parseFloat(y);
			if(x > 180){
				var obj = this.mercator2lonlat(x,y);
				x = obj.x;
				y = obj.y;
			}
			address = poi.address;
			html += "<li pindex='" + i +"'>"
				+	"	<div class='row'>" 
				+	"		<div class='col-md-2'>"
				+	"			<img src='../images/marker.png'>"
				+	"		</div>"
				+	"		<div class='col-md-10'>"
				+	"			<div class='row poi-name'>"
				+					name
				+	"			</div>"
				+	"			<div class='row poi-address'>"
				+	"				地址:"	+ address
				+	"			</div>"
				+	"		</div>"
				+	"	</div>"
				+	"</li>";
		}
		html += "</ul>";
		this.panel.find(".result-main-div").html(html);

		// 定位
		this.panel.find(".result-main-div li").click(function(){
			var index = $(this).attr("pindex");
			var overlay = mapObj.getOverlay(index);
			mapObj.setFitView(overlay);
		});

		var pageHtml = '<ul class="pagination">'
					+	'	<li class="pre-page">上一页</li>'
					+	'	<li class="next-page">下一页</li>'
					+	'</ul>';
		this.panel.find(".result-main-div").append(pageHtml);

		var that = this;
		// 上一页
		this.panel.find(".result-content-div .pre-page").click(function(){
			var page = that.poiCurrentPage;
			if(page <= 0){
				return;
			}
			that.poiCurrentPage = page - 1;
			that.searchPoiByPage(that.keyword,that.poiCurrentPage);
		});
		// 下一页
		this.panel.find(".result-content-div .next-page").click(function(){
			var count = that.panel.find(".result-main-div li").length;
			if(count < that.poiPageCount){
				return;
			}
			var page = that.poiCurrentPage;
			that.poiCurrentPage = page + 1;
			that.searchPoiByPage(that.keyword,that.poiCurrentPage);
		});	

	},

	// 墨卡托转经纬度
    mercator2lonlat : function(x,y){
        var lonlat={x:0,y:0};   
        var x = x/20037508.34*180; 
        var y = y/20037508.34*180; 
        y= 180/Math.PI*(2*Math.atan(Math.exp(y*Math.PI/180))-Math.PI/2);
        lonlat.x = x;
        lonlat.y = y;
        return lonlat;
    },


    showPoiInMap : function(pois){
		var poi = null, name = null, x = null,y = null,address = null;
		for(var i = 0; i < pois.length; ++i){
			poi = pois[i];
			if(poi == null){
				continue;
			}
			name = poi.name;
			x = poi.x;
			y = poi.y;
			x = parseFloat(x);
			y = parseFloat(y);
			if(x > 180){
				var obj = this.mercator2lonlat(x,y);
				x = obj.x;
				y = obj.y;
			}
			address = poi.address;
			var pt = new GeoBeans.Geometry.Point(x,y);
			var symbolizer = this.getSymbolizer("point");
			var marker = new GeoBeans.Overlay.Marker("maker",pt,symbolizer);
			mapObj.addOverlay(marker);
		}
		mapObj.draw();
    },
    getSymbolizer : function(type){
    	if(type == "point"){
    		var symbolizer = new GeoBeans.Symbolizer.PointSymbolizer();
			symbolizer.icon_url = "../images/marker.png";
			symbolizer.icon_offset_x = 0;
			symbolizer.icon_offset_y = 0;
			return symbolizer;
    	}
    },

    clearPoiSearch : function(){
    	if(mapObj != null){
    		mapObj.clearOverlays();
    	}
    	this.panel.find(".result-content-div .pagination").remove();
		this.panel.find(".result-main-div").empty();
		this.poiCurrentPage = null;
		this.panel.find(".search-keyword").val("");
    },

    // 标绘面板
    showOverlayPanel : function(){
    	mapObj.clearOverlays();
    	this.panel.find(".overlay-tab-panel").hide();
    	this.panel.find(".overlay-list-tab").show();
    	this.panel.find(".overlay-list-div").empty();
    	// 显示当前图层
    	if(MapCloud.currentLayer != null){
    		var dataSetName = MapCloud.mapLayersPanel.getDataSetName(MapCloud.currentLayer);
    		this.panel.find(".overlay-panel .current-layer-row span").html(dataSetName);
    	}
    	
    },
    // 开始标注
    startDrawOverlay : function(){
    	if(MapCloud.currentLayer == null){
    		return;
    	}
    	var layer = mapObj.getLayer(MapCloud.currentLayer);
    	if(layer == null){
    		return;
    	}
    	var geomType = layer.geomType;
    	if(geomType == GeoBeans.Geometry.Type.POINT || geomType == GeoBeans.Geometry.Type.MULTIPOINT){
    		this.trackMarker();
    	}else if(geomType == GeoBeans.Geometry.Type.LINESTRING || geomType == GeoBeans.Geometry.Type.MULTILINESTRING){
    		this.trackPolyline();
    	}else if(geomType == GeoBeans.Geometry.Type.POLYGON || geomType == GeoBeans.Geometry.Type.MULTIPOLYGON){
    		this.trackPolygon();
    	}
    },

	// 点
	trackMarker : function(){
		this.trackOverlayControl.trackMarker(this.callbackTrackOverlay);
	},

	// 线
	trackPolyline : function(){
		this.trackOverlayControl.trackLine(this.callbackTrackOverlay);
	},

	// 面
	trackPolygon : function(){
		this.trackOverlayControl.trackPolygon(this.callbackTrackOverlay);
	},

	callbackTrackOverlay : function(overlay){
		if(overlay == null){
			return;
		}
		var that = MapCloud.searchPanel;
		var overlays = mapObj.getOverlays();
		that.showOverlaysList(overlays);
	},

	showOverlaysList : function(overlays){
		if(overlays == null){
			return;
		}
		this.panel.find(".overlay-tab-panel").hide();
		this.panel.find(".overlay-list-tab").show();
		var overlay = null,name = null,type = null;
		var html = "";
		for(var i = 0; i < overlays.length; ++i){
			overlay = overlays[i];
			if(overlay == null){
				continue;
			}
			name = overlay.name;
			type = overlay.type;
			var typeHtml = this.getOverlayTypeSpanHtml(type);
			html += "<div class='row' oindex='" + i + "'>"
				+	"	<div class='col-md-2'>"
				+	typeHtml
				+	"	</div>"
				+	"	<div class='col-md-6'>"
				+	"		<span class='overlay-name'>" + name + "</span>"
				+	"	</div>"
				+	"	<div class='col-md-4'>"
				+	"		<a class='oper oper-edit-overlay' href='javascript:void(0)'>编辑</a>"
				+	"		<a class='oper oper-remove-overlay' href='javascript:void(0)'>删除</a>"
				+	"	</div>"
				+	"</div>";
		}
		this.panel.find(".overlay-list-div").html(html);

		// 删除overlay
		var that = this;
		this.panel.find(".overlay-list-div .oper-remove-overlay").click(function(){
			var name = $(this).parents(".row").find(".overlay-name").html();
			if(!confirm("确定要删除[" + name + "]吗?")){
				return;
			}
			var index = $(this).parents(".row").attr("oindex");
			mapObj.removeOverlay(parseInt(index));
			mapObj.draw();
			var overlays = mapObj.getOverlays();
			that.showOverlaysList(overlays);
		});

		// 编辑overlay
		this.panel.find(".overlay-list-div .oper-edit-overlay").click(function(){
			var index = $(this).parents(".row").attr("oindex");
			var overlay = mapObj.getOverlay(index);
			if(overlay == null){
				return;
			}
			that.editOverlay = overlay;
			that.showEditOverlayPanel(overlay);
			overlay.beginEdit();
			mapObj.setFitView(overlay);
		});
	},

	// 根据类型获取图标
	getOverlayTypeSpanHtml : function(type){
		var html = "";
		switch(type){
			case GeoBeans.Overlay.Type.MARKER:
				html = "<span class=' glyphicon "
					+   "glyphicon-map-marker span-overlay-marker'></span>";
				break;
			case GeoBeans.Overlay.Type.PLOYLINE:
				html = "<span class=' mc-icon "
					+	"mc-icon-line span-overlay-marker'></span>";
				break;
			case GeoBeans.Overlay.Type.POLYGON:
				html = "<span class=' glyphicon "
					+	"glyphicon-unchecked span-overlay-marker'></span>";
				break;
			default:
				html = "<span class=' glyphicon "
					+	"glyphicon-globe span-overlay-marker'></span>";
				break;
		}
		return html;
	},	

	showEditOverlayPanel : function(overlay){
		if(overlay == null){
			return;
		}

    	this.panel.find(".overlay-tab-panel").hide();
    	this.panel.find(".overlay-edit-tab").show();	

		// this.editOverlay = overlay.clone();
		this.editOverlay = overlay;
		var html = "";
		var name = overlay.name;
		var type = overlay.type;
		var typeHtml = this.getOverlayTypeSpanHtml(type);
		var kvMap = overlay.kvMap;
		var valuesHtml = this.getEditOverlayValuesHtml(kvMap);

		html = 	"<div class='row overlay-edit-name-row'>"
			+	"	<div class='input-group'>"
			+ 			"<span class='input-group-addon'>名称</span>"
			+	"	  <input type='text' class='form-control input-overlay-read' id='overlay_edit_name'"
			+	"		 value='" + name  + "'>"
			+	"	</div>"						
			+	"</div>	" 
			+ 	valuesHtml;
		this.panel.find(".overlay-edit-div").html(html);

		this.panel.find("[data-toggle='tooltip']").tooltip({container:'body'});

		//添加key/value
		var that = this;
		this.panel.find(".glyphicon-plus").each(function(){
			$(this).click(function(){
				var html = "<li class='row left_row'>"
					+	"	<div class='col-md-4 overlay_key'>"
					+	"		<input type='text' class='form-control' placeholder='key' value=''>"
					+	"	</div>"
					+	"	<div class='input-group col-md-8 overlay_value'>"
					+	"		<input type='text' class='form-control' placeholder='Value' value=''>"
					+	"		<span class='input-group-addon glyphicon glyphicon-trash span-overlay-marker'></span>"
					+	"	</div>"
					+	"</li>";
				that.panel.find("#overlay_edit_values_row").append(html);
				that.panel.find(".glyphicon-trash").each(function(){
					$(this).click(function(){
						$(this).parents("li").remove();
					});
				});				
			});
		});	 

		// 删除一行
		this.panel.find(".glyphicon-trash").each(function(){
			$(this).click(function(){
				$(this).parents("li").remove();
			});
		});   		
	},

	getEditOverlayValuesHtml : function(kvMap){
		var html =  "<div class='row left_row_wrapper' id='overlay_add_value_row'>"
				+	"	 <button type='button' class='btn glyphicon glyphicon-plus "
				+	"		col-md-4 col-md-offset-4' data-toggle='tooltip' data-placement='top' data-original-title='添加属性'></button>"
				+	"</div>"
				+	"<ul class='row left_row_wrapper' id='overlay_edit_values_row'>";
		for(var key in kvMap){
			var value = kvMap[key];
			html += "<li class='row left_row'>"
				+	"	<div class='col-md-4 overlay_key'>"
				+	"		<input type='text' class='form-control' value='" + key + "'>"
				+	"	</div>"
				+	"	<div class='input-group col-md-8 overlay_value'>"
				+	"		<input type='text' class='form-control' value='" + value + "'>"
				+	"		<span class='input-group-addon glyphicon glyphicon-trash span-overlay-marker'></span>"
				+	"	</div>"
				+	"</li>";
		}
		html += "</ul>";
		return html;
	},

	// 显示图层
	showHeatMapLayers : function(){
		if(mapObj == null){
			return;
		}
		var layers = mapObj.getLayers();
		var layer = null,layerName = null,dataSetName = null,geomType = null;
		var html = "";
		for(var i = 0; i < layers.length;++i){
			layer = layers[i];
			if(layer == null){
				continue;
			}
			layerName = layer.name;
			geomType = layer.geomType;
			if(MapCloud.mapLayersPanel == null){
				MapCloud.mapLayersPanel = new MapCloud.MapLayersPanel("map_layers_wrapper");
			}
			dataSetName = MapCloud.mapLayersPanel.getDataSetName(layerName);
			if(geomType == GeoBeans.Geometry.Type.POINT || geomType == GeoBeans.Geometry.Type.MULTIPOINT){
				html += "<option value='" + layerName + "'>" + dataSetName + "</option>";
			}
		}
		this.panel.find("#heatmap_layers").html(html);
	},

	// 删除地图中专题图
	removeChart : function(){
		if(this.heatLayerName != null){
			mapObj.removeHeatMap(this.heatLayerName);
			mapObj.draw();
		}
		mapObj.removeLayer("chart");
		mapObj.draw();
	},

	setOverlayLayer:function(dataSetName,layerName){
		if(dataSetName == null || layerName == null){
			return;
		}
		this.panel.find(".current-layer-div span").html(dataSetName);
	},
});