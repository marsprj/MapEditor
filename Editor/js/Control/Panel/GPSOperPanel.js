MapCloud.GPSOperPanel = MapCloud.Class(MapCloud.Panel,{
	// gpsMgr : null,

	initialize : function(id){
		MapCloud.Panel.prototype.initialize.apply(this,arguments);
		// gpsMgr = new GeoBeans.GPSManager(url);
		var that = this;

		// this.panel.find(".btn-oper").click(function(){
		// 	var operLi = that.panel.find(".gps-oper.selected");
		// 	if(operLi.length == 0){
		// 		MapCloud.notify.showInfo("请选择一个操作","Warning");
		// 		return;
		// 	}
		// 	var operName = operLi.find("span").text();
		// 	that.showOperDialog(operName);
		// });
		
		var dialog = this;
		this.panel.find(".btn-hide").click(function(){
			var body = dialog.panel.find(".panel-content");
			if(body.css("height") == "600px"){
				body.css("height","0px");
				dialog.panel.css("border-bottom","none");
			}else{
				body.css("height","600px");
				dialog.panel.css("border-bottom","1px solid #d3d3d3");
			}
		});		
	},


	showPanel : function(){
		if(this.panel.css("display") == "none"){
			this.cleanup();
			this.panel.css("display","block");
			gpsManager.getCapabilities(this.getCapabilities_callback);
		}
	},

	getCapabilities_callback : function(list){
		
		var panel = MapCloud.gps_oper_panel;
		panel.showOperList(list);
	},

	// 操作列表
	showOperList : function(list){
		if(list == null){
			return;
		}
		var html = '<ul class="nav gps-oper-nav">';
		var setObj = null;
		var descripiton = null;
		var operList = null;
		var operObj = null;
		var name = null;
		for(var i = 0; i < list.length; ++i){
			set = list[i];
			if(set == null){
				continue;
			}
			description = set.description;
			html += '<li>'
				+ '	<a href="javascript:void(0)" class="gps-oper-set">'
				+ '		<i class="fa fa-inbox"></i>'
				+ '		<span>' + description + "</span>"
				+ '	</a>';
			operList = set.operList;
			if(operList == null){
				continue;
			} 
			html += '<ul class="nav">';
			for(var j = 0; j < operList.length; ++j){
				operObj = operList[j];
				if(operObj == null){
					continue;
				}
				name = operObj.name;
				var alias = operObj.alias;
				html += '<li>'
					+ 	'	<a href="javascript:void(0)" class="gps-oper" oname="' + name+ '">'
					+	'		<i class="fa fa-wrench"></i>'
					+	'		<span>' + alias + '</span>'
					+	'	</a>'
					+	"</li>";
			}
			html += "</ul>";
			html += '</li>';
		}
		html += "</ul>";

		this.panel.find(".panel-content").html(html);

		this.registerEvent();
	},

	// 注册收缩事件
	registerEvent : function(){
		
		var dialog = this;
		// 单击选中
		this.panel.find(".gps-oper").click(function(){
			dialog.panel.find(".gps-oper.selected").removeClass("selected");
			$(this).addClass("selected");
		}).dblclick(function(){
			var operName = $(this).attr("oname");
			dialog.showOperDialog(operName);
		});

		this.panel.find(".gps-oper-set").click(function(){
			var ul = $(this).parent().find("ul");
			if(ul.css("display") == "none"){
				ul.slideDown();
			}else if(ul.css("display","block")){
				ul.slideUp();
			}
		});


	},

	// 展示操作对话框
	showOperDialog : function(operName){
		if(operName == null){
			return;
		}
		var dialog = null;
		switch(operName){
			case "FeatureImport":{
				dialog = MapCloud.gps_feature_import_dialog;
				break;
			}
			case "FeatureProject":{
				dialog = MapCloud.gps_feature_project_dialog;
				break;
			}
			case "CsvImport":{
				dialog = MapCloud.gps_csv_import_dialog;
				break;
			}
			case "RasterEdgeDetect":{
				dialog = MapCloud.gps_raster_edge_detect_dialog;
				break;
			}
			case "RasterExtractByRectangle":{
				dialog = MapCloud.gps_raster_extract_dialog;
				break;
			}
			case "RasterReverse":{
				dialog = MapCloud.gps_raster_reverse_dialog;
				break;
			}
			case "RasterGraylize":{
				dialog = MapCloud.gps_raster_graylize_dialog;
				break;
			}
			case "RasterSmooth":{
				dialog = MapCloud.gps_raster_smooth_dialog;
				break;
			}
			case "RasterStretch":{
				dialog = MapCloud.gps_raster_stretch_dialog;
				break;
			}
			case "RasterSubtract":{
				dialog = MapCloud.gps_raster_subtract_dialog;
				break;
			}
			case "RasterPixelBlend":{
				dialog = MapCloud.gps_raster_pixel_blend_dialog;
				break;
			}
			case "RasterThreshold":{
				dialog = MapCloud.gps_raster_threshold_dialog;
				break;
			}
			case "RasterHistogramEqualization":{
				dialog = MapCloud.gps_raster_his_equal_dialog;
				break;
			}
			case "RasterSepiaTone":{
				dialog = MapCloud.gps_raster_sepia_tone_dialog;
				break;
			}
			case "DemSlope":{
				dialog = MapCloud.gps_dem_slope_dialog;
				break;
			}
			case "DemAspect":{
				dialog = MapCloud.gps_dem_aspect_dialog;
				break;
			}
			case "DemStretch":{
				dialog = MapCloud.gps_dem_stretch_dialog;
				break;
			}
			case "DemHillshade":{
				dialog = MapCloud.gps_dem_hillshade_dialog;
				break;
			}
			case "Delaunay":{
				dialog = MapCloud.gps_delaunay_dialog;
				break;
			}
			case "GetArea":{
				dialog = MapCloud.gps_get_area_dialog;
				break;
			}
			case "GetLength":{
				dialog = MapCloud.gps_get_length_dialog;
				break;
			}
			case "Buffer":{
				dialog = MapCloud.gps_buffer_dialog;
				break;
			}
			case "Centroid":{
				dialog = MapCloud.gps_centroid_dialog;
				break;
			}
			case "ConvexHull":{
				dialog = MapCloud.gps_convex_hull_dialog;
				break;
			}
			case "MultiPointToPoints":{
				dialog = MapCloud.gps_multi_point_to_points_dialog;
				break;
			}
			case "LineToPoints":{
				dialog = MapCloud.gps_line_to_points_dialog;
				break;
			}
			case "PolygonToPoints":{
				dialog = MapCloud.gps_polygon_to_points_dialog;
				break;
			}
			case "PolygonToLine":{
				dialog = MapCloud.gps_polygon_to_line_dialog;
				break;
			}
			case "BuildPyramid":{
				dialog = MapCloud.gps_build_pyramid_dialog;
				break;
			}
			case "GenerateRandomPoints":{
				dialog = MapCloud.gps_gen_random_points_dialog;
				break;
			}
			case "GenerateRandomPointsInPolygon":{
				dialog = MapCloud.gps_gen_random_points_in_polygon_dialog;
				break;
			}
			case "UpdateTile":{
				dialog = MapCloud.gps_update_tile_dialog;
				break;
			}
			case "KMean":{
				dialog = MapCloud.gps_kmean_dialog;
				break;
			}
			default:{
				break;
			} 
		}
		if(dialog != null){
			dialog.showDialog();
		}

	}
});