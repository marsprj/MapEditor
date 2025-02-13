(function(){
    window.Radi = {};
})();
Radi.Earth = {
    handler : null,

    initEarth : function (container){
        var value = Math.PI * 256.0 / 180.0;
        var extent = new Cesium.Rectangle(-value, -value, value, value);

        g_earth_view = new Cesium.Viewer('earth_container',{
            animation:false,        //动画控制不显示
            baseLayerPicker:false,  //图层控制显示
            geocoder:false,         //地名查找不显示
            timeline:false,         //时间线不显示
            sceneModePicker:false,  //投影方式显示,
            fullscreenButton:false,
            homeButton:false,
            infoBox:false,
            selectionIndicator:false,
            navigationHelpButton:false,
            navigationInstructionsInitiallyVisible:false,
            scene3DOnly:true,
            imageryProvider : new Cesium.WebMapTileServiceImageryProvider({
                                          url : '/QuadServer/services/maps/wmts100',
                                          layer : 'world_image',
                                          style : 'default',
                                          format : 'image/jpeg',
                                          tileMatrixSetID : 'PGIS_TILE_STORE',
                                          // tileMatrixLabels : ['default028mm:0', 'default028mm:1', 'default028mm:2' ...],
                                          minimumLevel: 0,
                                          maximumLevel: 19,
                                          credit : new Cesium.Credit('world_country'),
                                          tilingScheme : new Cesium.GeographicTilingScheme({rectangle : extent})
                                })
            //  imageryProvider : new Cesium.ArcGisMapServerImageryProvider({
            //     url : 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
            // }),            
        });
        var terrainProvider = new Cesium.CesiumTerrainProvider({
                                      // url : '//assets.agi.com/stk-terrain/world',
                                    url : '/aster',
                                    requestVertexNormals: true
                                  });
        g_earth_view.terrainProvider = terrainProvider;
        g_earth_view.scene.globe.enableLighting = false;


        // 添加要素图层
        this.addWorldTrans();
         // 定义当前场景的画布元素的事件处理
        this.handler = new Cesium.ScreenSpaceEventHandler(g_earth_view.scene.canvas);
    },

    flyTo : function(x, y, h,heading,pitch,roll){
        g_earth_view.camera.flyTo({
            destination : Cesium.Cartesian3.fromDegrees(x, y, h),
            orientation :{
                heading : (heading == null)? Cesium.Math.toRadians(360): (Cesium.Math.toRadians(heading)),
                pitch : (pitch == null)?Cesium.Math.toRadians(-90) : Cesium.Math.toRadians(pitch),
                roll : (roll == null) ? 0 : Cesium.Math.toRadians(roll)  
            }            
        });
    },

    camera : function(){
        return g_earth_view.camera;
    },

    getCameraPosition : function(){
        var camera = this.camera();
        var position = camera.positionCartographic;
        // var ellipsoid = g_earth_view.scene.globe.ellipsoid;
        // var cartographic = ellipsoid.cartesianToCartographic(position);
        var lat = Cesium.Math.toDegrees(position.latitude);
        var lon = Cesium.Math.toDegrees(position.longitude);

        return {
            lat : lat,
            lon : lon,
            height : position.height
        };
    },

    addPin : function(x, y){
        var pinBuilder = new Cesium.PinBuilder();

        var bluePin = g_earth_view.entities.add({
            name : 'Blank blue pin',
            position : Cesium.Cartesian3.fromDegrees(118, 39.9208667),
            billboard : {
                image : pinBuilder.fromColor(Cesium.Color.ROYALBLUE, 48).toDataURL(),
                verticalOrigin : Cesium.VerticalOrigin.BOTTOM
            }
        });

        var url = Cesium.buildModuleUrl('Assets/Textures/maki/grocery.png');
        var groceryPin = Cesium.when(pinBuilder.fromUrl(url, Cesium.Color.GREEN, 48), function(canvas) {
            return g_earth_view.entities.add({
                name : 'Grocery store',
                position : Cesium.Cartesian3.fromDegrees(x, y),
                billboard : {
                    image : canvas.toDataURL(),
                    verticalOrigin : Cesium.VerticalOrigin.BOTTOM
                }
            });
        });

        //Cesium.when.all([bluePin, questionPin, groceryPin, hospitalPin], function(pins){
        Cesium.when.all([bluePin, groceryPin], function(pins){
            g_earth_view.zoomTo(pins);
        });
    },

    addPoint : function(x, y, size){
        g_earth_view.entities.add({
            position : Cesium.Cartesian3.fromDegrees(x, y),
            point : {
                pixelSize : size,
                color : Cesium.Color.YELLOW
            }
        });
    },

    addLine : function(coordinates, width){
        g_earth_view.entities.add({
            name : 'Glowing blue line on the surface',
            polyline : {
                positions : Cesium.Cartesian3.fromDegreesArray(coordinates),
                width : width,
                material : new Cesium.PolylineGlowMaterialProperty({
                    glowPower : 0.2,
                    color : Cesium.Color.YELLOW
                })
            }
        });    
    },

    addPolygon : function(coordinates, color,height,outline){

        var polygon = g_earth_view.entities.add({
            name : 'polygon',
            polygon : {
                hierarchy : Cesium.Cartesian3.fromDegreesArray(coordinates),
                material : color,
                extrudedHeight : height,
                outline : (outline== null)?true : outline

            }
        });
        return polygon;
    },

    addBillboard : function(x,y,caption,url){
        // g_earth_view.entities.add({
        //     position : Cesium.Cartesian3.fromDegrees(x, y),
        //     billboard :{
        //         //image : '../images/Cesium_Logo_overlay.png'
        //         image : url
        //     }
        // });

        var billboard = {
            position : Cesium.Cartesian3.fromDegrees(x, y),
            billboard :{
                image : url
            },
            label : {
                text : caption,
                font : "16px Microsoft YaHei",
                outlineColor : Cesium.Color.BLACK ,
                style : Cesium.LabelStyle.FILL_AND_OUTLINE ,
                outlineWidth : 2,
                horizontalOrigin : Cesium.HorizontalOrigin.LEFT,
                verticalOrigin   : Cesium.VerticalOrigin.MIDDLE,
                pixelOffset : new Cesium.Cartesian2(10,0)
            }
        };

        return g_earth_view.entities.add(billboard);


/*        viewer.entities.add({
            position : Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
            billboard : {
                image : '../images/Cesium_Logo_overlay.png', // default: undefined
                show : true, // default
                pixelOffset : new Cesium.Cartesian2(0, -50), // default: (0, 0)
                eyeOffset : new Cesium.Cartesian3(0.0, 0.0, 0.0), // default
                horizontalOrigin : Cesium.HorizontalOrigin.CENTER, // default
                verticalOrigin : Cesium.VerticalOrigin.BOTTOM, // default: CENTER
                scale : 2.0, // default: 1.0
                color : Cesium.Color.LIME, // default: WHITE
                rotation : Cesium.Math.PI_OVER_FOUR, // default: 0.0
                alignedAxis : Cesium.Cartesian3.ZERO, // default
                width : 100, // default: undefined
                height : 25 // default: undefined
            }
        });*/
    },

    zoom : function(objs){
        Cesium.when.all(objs, function(pins){
            g_earth_view.zoomTo(objs);
        });
    },

    cleanup : function(){
        g_earth_view.entities.removeAll();
        $("#legend_container").empty();
        MapCloud.showProject = false;
    },

    addCylinder : function(x,y,z,radius,color){
        var cylinder = g_earth_view.entities.add({
            name : 'Cylinder',
            position: Cesium.Cartesian3.fromDegrees(x,y,0),
             cylinder : {
                length : z,
                topRadius : radius,
                bottomRadius : radius,
                material : color
            },
        });
        return cylinder;
    },



    addLabel : function(x,y,z,text){
        var label = g_earth_view.entities.add({
            position : Cesium.Cartesian3.fromDegrees(x, y,z),
            label : {
                text : text,
                font : "16px Microsoft YaHei",
                outlineColor : Cesium.Color.BLACK ,
                style : Cesium.LabelStyle.FILL_AND_OUTLINE ,
                outlineWidth : 2,
                // fillColor : Cesium.Color.WI,
                // heightReference : Cesium.HeightReference.CLAMP_TO_GROUND ,
                pixelOffsetScaleByDistance : new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5)
            }
        });
        return label;
    },

    // cartesian 转经纬度的
    cartesianToDegrees : function(cartesian){
        if(!(cartesian instanceof Cesium.Cartesian3)){
            return null;
        }
        var cartographic = ellipsoid.cartesianToCartographic(position);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var lon = Cesium.Math.toDegrees(cartographic.longitude);
        return{
            lat : lat,
            lon : lon,
            height : cartographic.height
        };
    },

    // 没有高度转换有问题
    // toLatLon : function(x,y){
    //     if(x == null || y == null){
    //         return null;
    //     }
    //     var position = new Cesium.Cartesian3(x,y,0); 
    //     var ellipsoid = g_earth_view.scene.globe.ellipsoid;
    //     if(ellipsoid == null){
    //         return null;
    //     }
    //     var cartographic = ellipsoid.cartesianToCartographic(position);
    //     if(cartographic == null){
    //         return null;
    //     }
    //     var lat = Cesium.Math.toDegrees(cartographic.latitude);
    //     var lon = Cesium.Math.toDegrees(cartographic.longitude);
    //     return {
    //         lat : lat,
    //         lon : lon
    //     };
    // },

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

    // 增加监听事件
    addEventListener : function(event,handler){
        var ellipsoid = g_earth_view.scene.globe.ellipsoid;
        this.handler.setInputAction(function(movement) {
            if(movement.position == null){
                return;
            }
            //通过指定的椭球或者地图对应的坐标系，将鼠标的二维坐标转换为对应椭球体三维坐标
            cartesian = g_earth_view.camera.pickEllipsoid(movement.position, ellipsoid);
            if (cartesian) {
                //将笛卡尔坐标转换为地理坐标
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                //将弧度转为度的十进制度表示
                longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
                latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
                //获取相机高度
                height = Math.ceil(g_earth_view.camera.positionCartographic.height);
                handler({
                    lat : latitudeString,
                    lon : longitudeString,
                    height : height
                });
            }else {
                handler(null);
            }
        }, event);
    },

    // 鼠标抬起事件
    addClickListener : function(handler){
        var ellipsoid = g_earth_view.scene.globe.ellipsoid;
        this.handler.setInputAction(function(movement) {
            if(movement.position == null){
                return;
            }
            //通过指定的椭球或者地图对应的坐标系，将鼠标的二维坐标转换为对应椭球体三维坐标
            cartesian = g_earth_view.camera.pickEllipsoid(movement.position, ellipsoid);
            if (cartesian) {
                //将笛卡尔坐标转换为地理坐标
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                //将弧度转为度的十进制度表示
                longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
                latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
                //获取相机高度
                height = Math.ceil(g_earth_view.camera.positionCartographic.height);
                handler({
                    lat : latitudeString,
                    lon : longitudeString,
                    height : height
                });
            }else {
                handler(null);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    },

    // 鼠标移动事件
    addMoveListener : function(handler){
        var ellipsoid = g_earth_view.scene.globe.ellipsoid;
        this.handler.setInputAction(function(movement) {
            if(movement.endPosition == null){
                return;
            }
            //通过指定的椭球或者地图对应的坐标系，将鼠标的二维坐标转换为对应椭球体三维坐标
            cartesian = g_earth_view.camera.pickEllipsoid(movement.endPosition, ellipsoid);
            if (cartesian) {
                //将笛卡尔坐标转换为地理坐标
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                //将弧度转为度的十进制度表示
                longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
                latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
                //获取相机高度
                height = Math.ceil(g_earth_view.camera.positionCartographic.height);
                handler({
                    lat : latitudeString,
                    lon : longitudeString,
                    height : height
                });
            }else {
                handler(null);
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    },

    // 鼠标滚动事件
    addScrollEventListener : function(handler){
        this.handler.setInputAction(function(wheelment) {
            var height = Math.ceil(g_earth_view.camera.positionCartographic.height);
            handler(height);
        }, Cesium.ScreenSpaceEventType.WHEEL);
    },

    addWorldTrans : function(){
        var value = Math.PI * 256.0 / 180.0;
        var extent = new Cesium.Rectangle(-value, -value, value, value);
        var layers = g_earth_view.scene.imageryLayers;
        var trans = layers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
                                          url : '/QuadServer/services/maps/wmts100',
                                          layer : 'world_trans',
                                          style : 'default',
                                          format : 'image/jpeg',
                                          tileMatrixSetID : 'PGIS_TILE_STORE',
                                          // tileMatrixLabels : ['default028mm:0', 'default028mm:1', 'default028mm:2' ...],
                                          minimumLevel: 0,
                                          maximumLevel: 19,
                                          credit : new Cesium.Credit('world_country'),
                                          tilingScheme : new Cesium.GeographicTilingScheme({rectangle : extent})
                                }));
    },

    // 添加模型
    addModel : function(url,x,y,height,scale){
        if(url == null || x == null || y == null || height == null){
            return;
        }
        var position = Cesium.Cartesian3.fromDegrees(x, y, height);
        var heading = Cesium.Math.toRadians(0);
        var pitch = 0;
        var roll = 0;
        var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, heading, pitch, roll);

        if(scale == null){
            scale = 1;
        }


        var entity = g_earth_view.entities.add({
            name : url,
            position : position,
            orientation : orientation,
            model : {
                uri : url,
                scale : scale,
                // minimumPixelSize : 128,
                // maximumScale : 20000
            }
        });       
        // g_earth_view.trackedEntity = entity;

        // 两种加载方式
        // var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
        //     Cesium.Cartesian3.fromDegrees(x, y, height));
        // var model = g_earth_view.scene.primitives.add(Cesium.Model.fromGltf({
        //     url : url,
        //     modelMatrix : modelMatrix,
        //     scale : scale
        // }));   
    },

    getExtentView : function(){
        var scene = g_earth_view.scene;
        var ellipsoid = g_earth_view.scene.globe.ellipsoid;
        var c2 = new Cesium.Cartesian2(0,0);
        var leftTop = this.camera().pickEllipsoid(c2, ellipsoid);
        
        c2 = new Cesium.Cartesian2(scene.canvas.width, scene.canvas.height);
        var rightDown = this.camera().pickEllipsoid(c2, ellipsoid);
        
        if(leftTop != null && rightDown != null){
            leftTop = ellipsoid.cartesianToCartographic(leftTop);
            rightDown = ellipsoid.cartesianToCartographic(rightDown);
            var xmin = Number(Cesium.Math.toDegrees(leftTop.longitude).toFixed(3));
            var ymin = Number(Cesium.Math.toDegrees(rightDown.latitude).toFixed(3));
            var xmax = Number(Cesium.Math.toDegrees(rightDown.longitude).toFixed(3));
            var ymax = Number(Cesium.Math.toDegrees(leftTop.latitude).toFixed(3));
            return new GeoBeans.Envelope(xmin,ymin,xmax,ymax);
        }else{//The sky is visible in 3D
            return null;
        }
    },

    addMoveModelEventListener: function(){
        var that = this;
        that.preObj = null;
        var scene = g_earth_view.scene;
        var eventAction = this.handler.getInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction(function(movement) {
            if(eventAction != null){
                eventAction(movement);
            }
            var pickedObject = scene.pick(movement.endPosition);
            if(!MapCloud.showProject){
                return;
            }
            if (Cesium.defined(pickedObject)) {
                if(that.preObj != null){
                    if(that.preObj.billboard != null){
                         that.preObj.billboard.scale = 1.0;
                    }
                    if(that.preObj.label!= null){
                         that.preObj.label.text.setValue("");
                    }
                }
                if(pickedObject.id.billboard != null){
                     pickedObject.id.billboard.scale = 1.3;
                }
                if(pickedObject.id.label != null){
                    pickedObject.id.label.pixelOffset.setValue(new Cesium.Cartesian2(20,0));
                    pickedObject.id.label.text.setValue(pickedObject.id.billboard.text);
                }
                
                that.preObj = pickedObject.id;
            }else {
                if(that.preObj != null){
                    if(that.preObj.billboard != null){
                         that.preObj.billboard.scale = 1.0;
                    }
                    if(that.preObj.label!= null){
                         that.preObj.label.text.setValue("");
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    },


};