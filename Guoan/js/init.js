$().ready(function(){
	var userName = "user1";
	var mapName = "guoan";
	user = new GeoBeans.User(userName);
	mapManager = user.getMapManager();

	mapObj = mapManager.getMap("map_container",mapName);
	if(mapObj != null){
		var layer = new GeoBeans.Layer.QSLayer("base","/QuadServer/maprequest?services=world_vector");
		var center = new GeoBeans.Geometry.Point(117.203499,39.131119);
		layer.MAX_ZOOM_LEVEL = 19;
		mapObj.setBaseLayer(layer);
		mapObj.setLevel(10);
		mapObj.setCenter(center);
		mapObj.draw();
		
	}

	$("[data-toggle='tooltip']").tooltip({container:'body'});
	MapCloud.currentLayer = null;
	MapCloud.mapBar = new MapCloud.MapBar("map_bar_wrapper");
	MapCloud.mapLayersPanel = new MapCloud.MapLayersPanel("map_layers_wrapper");
	MapCloud.searchPanel = new MapCloud.SearchPanel("left_panel");
	
	MapCloud.baseLayerPanel = new MapCloud.BaseLayerPanel("base_layer_wrapper");
	
	MapCloud.queryResultPanel = new MapCloud.QueryResultPanel("query_results_container");
	MapCloud.notify = new MapCloud.Notify("container","alert_loading");	
	
	MapCloud.currentCityPanel = new MapCloud.CurrentCityPanel("city_container");
	MapCloud.cityPanel = new MapCloud.CityPanel("city_list_container");
	MapCloud.cityPosition = new MapCloud.CityPosition();
	MapCloud.positionControl = new MapCloud.PositionControl();
});