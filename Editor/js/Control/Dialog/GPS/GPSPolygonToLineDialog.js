MapCloud.GPSPolygonToLineDialog = MapCloud.Class(MapCloud.Dialog,{
	
	// 输入数据库
	inputSourceName : null,

	// 输入数据
	inputTypeName : null,

	// 输出数据库
	outputSourceName : null,	


	initialize : function(id){
		MapCloud.Dialog.prototype.initialize.apply(this,arguments);
		var dialog = this;

		this.registerPanelEvent();
	},

	registerPanelEvent : function(){
		var dialog = this;

		this.panel.find('[data-toggle="tooltip"]').tooltip({container: 'body'});

		// 展开log
		dialog.panel.find(".gps-oper-btn-log").click(function(){
			if($(this).hasClass("log-col")){
				var height = dialog.panel.find(".modal-body").css("height");
				height = parseInt(height.slice(0,height.lastIndexOf("px")));
				var heightExp = height + 200;
				dialog.panel.find(".modal-body").css("height",heightExp + "px");

				dialog.panel.find(".gps-oper-log-wrapper").slideDown(500); 
				$(this).find("i").removeClass("fa-chevron-down").addClass("fa-chevron-up");
				$(this).removeClass("log-col").addClass("log-exp");
			}else{
				var height = dialog.panel.find(".modal-body").css("height");
				height = parseInt(height.slice(0,height.lastIndexOf("px")));
				var heightCol = height - 200;
				dialog.panel.find(".modal-body").css("height",heightCol + "px");
				
				dialog.panel.find(".gps-oper-log-wrapper").slideUp(500);
				$(this).find("i").removeClass("fa-chevron-up").addClass("fa-chevron-down");
				$(this).removeClass("log-exp").addClass("log-col");
			}
		});		

		// choose input source name & input type name
		dialog.panel.find(".btn-choose-input").click(function(){
			MapCloud.vector_db_dialog.showDialog("polygonToLine");
		});


		// choose output sourcename
		dialog.panel.find(".btn-choose-output-source-name").click(function(){
			MapCloud.gps_output_source_dialog.showDialog("polygonToLine","Feature");
		});


		// 操作
		this.panel.find(".gps-btn-oper-btn").click(function(){
			if(dialog.inputSourceName == null || dialog.inputTypeName == null){
				MapCloud.notify.showInfo("请选择输入的数据","Warning");
				return;
			}

			if(dialog.outputSourceName == null){
				MapCloud.notify.showInfo("请选择输出的数据库","Warning");
				return;
			}

			var outputTypeName = dialog.panel.find(".gps-output-typename").val();
			if(outputTypeName == ""){
				MapCloud.notify.showInfo("请输入输出的数据名称","Warning");
				dialog.panel.find(".gps-output-typename").focus();
				return;
			}
			
			var nameReg =  /^[a-zA-Z][a-zA-Z0-9_]*$/;
			if(!nameReg.test(outputTypeName)){
				MapCloud.notify.showInfo("请输入有效的输出数据名称","Warning");
				dialog.panel.find(".gps-output-typename").focus();
				return;
			}

			MapCloud.notify.loading();
			gpsManager.polygonToLine(dialog.inputSourceName,dialog.inputTypeName,
				dialog.outputSourceName,outputTypeName,dialog.polygonToLine_callback);
		});

		// 重置
		this.panel.find(".gps-btn-reset").click(function(){
			dialog.cleanup();
		});
	},	

	cleanup : function(){
		this.panel.find(".gps-input-source-name").val("");
		this.panel.find(".gps-input-type-name").val("");
		this.panel.find(".gps-output-source-name").val("");
		this.panel.find(".gps-output-typename").val("");
		this.panel.find(".gps-oper-log-div").empty();

		this.inputSourceName = null;
		this.inputTypeName = null;
		this.outputSourceName = null;

	},

	// 输入参数
	setDataSet : function(inputSourceName,inputTypeName){
		this.inputSourceName = inputSourceName;
		this.inputTypeName = inputTypeName;
		this.panel.find(".gps-input-source-name").val(this.inputSourceName);
		this.panel.find(".gps-input-type-name").val(this.inputTypeName);
	},

	// 输出
	setOutputSource : function(outputSourceName){
		this.outputSourceName = outputSourceName;
		this.panel.find(".gps-output-source-name").val(this.outputSourceName);
	},



	polygonToLine_callback : function(result){
		MapCloud.notify.hideLoading();
		var dialog = MapCloud.gps_polygon_to_line_dialog;
		var html = "<div class='row'>"
			+ "输入 [ 数据库 : " + dialog.inputSourceName + " ; 表 : " + dialog.inputTypeName
			+ " ]; 输出 [ 数据库 : " + dialog.outputSourceName + "; 表 : " 
			+ dialog.panel.find(".gps-output-typename").val() + " ];  结果 : "
			+ result;
		dialog.panel.find(".gps-oper-log-div").append(html);
	}

});