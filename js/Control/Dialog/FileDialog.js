MapCloud.FileDialog = MapCloud.Class(MapCloud.Dialog, {
	
	// 当前面板的文件列表
	list : null,


	initialize : function(id){
		MapCloud.Dialog.prototype.initialize.apply(this, arguments);
		
		var dialog = this;
		dialog.registerPanelEvent();
	},

	registerPanelEvent : function(){
		var dialog = this;

		this.panel.find('[data-toggle="tooltip"]').tooltip({container: 'body'});


		this.panel.find(".btn-confirm").click(function(){
			switch(dialog.flag){
				case "choose-shp":{
					var importPaths = dialog.getImportPaths();
					if(importPaths.length == 0){
						MapCloud.notify.showInfo("请选择要导入的shp文件","Warning");
						return;
					}
					MapCloud.import_dialog.addImportPaths(importPaths);
					break;
				}
				case "gps-choose-shp":{
					var importPaths = dialog.getImportPaths();
					if(importPaths.length == 0){
						MapCloud.notify.showInfo("请选择要导入的shp文件","Warning");
						return;
					}
					MapCloud.gps_feature_import_dialog.addImportPaths(importPaths);
					break;
				}
				case "image":{
					var importPaths = dialog.getImportPaths();
					if(importPaths.length == 0){
						MapCloud.notify.showInfo("请选择要导入的shp文件","Warning");
						return;
					}
					MapCloud.import_raster_dialog.addImportPaths(importPaths);
					break;	
				}
				case "csv":{
					var importPath = dialog.getImportCSVPath();
					if(importPath == null){
						MapCloud.notify.showInfo("请选择要导入的csv文件","Warning");
						return;
					}
					MapCloud.importCSV_dialog.setImportCsv(importPath);
					break;
				}
				case "csvImport":{
					var importPath = dialog.getImportCSVPath();
					if(importPath == null){
						MapCloud.notify.showInfo("请选择要导入的csv文件","Warning");
						return;
					}
					MapCloud.gps_csv_import_dialog.setImportCsv(importPath);
					break;
				}
				default:
					break;
			}
			dialog.closeDialog();
		});

		// 新建文件夹
		this.panel.find(".btn-add-folder").click(function(){
			MapCloud.create_folder_dialog.showDialog("file");
		});

		// 删除
		this.panel.find(".btn-remove-file").click(function(){
			var checkboxs = dialog.panel.find("input[type='checkbox']:checked");
			if(checkboxs.length == 0){
				var path = dialog.panel.find(".tree-folder.selected").attr("fpath");
				if(path == "/"){
					MapCloud.notify.showInfo("无法删除根目录","Warning");
					return;
				}
				var folderName = dialog.panel.find(".tree-folder.selected span").html();
				if(!confirm("确定要删除文件夹[" + folderName + "]?")){
					return;
				}
				// 更改为上一级对话框
				var parentNode = dialog.panel.find(".tree-folder.selected").parents(".nav").first().prev();
				dialog.panel.find(".tree-folder.selected").parents(".nav").first().remove();
				dialog.panel.find(".tree-folder").removeClass("selected");
				parentNode.addClass("selected");
				var parentPath = parentNode.attr("fpath");
				dialog.panel.find("#current_path").val(parentPath);

				dialog.removeFolder(path);
				return;
			}
			if(!confirm("确定要删除吗？")){
				return;
			}
			checkboxs.each(function(){
				var parent = $(this).parent().parent().parent();
				var path = parent.attr("fpath");
				if(parent.hasClass("row-file")){
					dialog.removeFile(path);
				}else if(parent.hasClass("row-folder")){
					dialog.removeFolder(path);
				}
			});
		});

		// 上传
		this.panel.find(".btn-upload-file").click(function(){
			
			var currentPath = dialog.panel.find("#current_path").val();
			MapCloud.importVector_dialog.showDialog(currentPath,"file");
		});

		// 刷新
		this.panel.find(".btn-refresh").click(function(){
			var path = dialog.panel.find("#current_path").val();
			dialog.getListRefresh(path);			
		});

		// 过滤文件
		this.panel.find("#file_filter_select").change(function(){
			var list = dialog.getFilterList();
			dialog.showListPanel(list);
		});

		// 全选或者全不选
		this.panel.find(".select-list").click(function(){
			var checkboxs = dialog.panel.find(".file-list-content-div>.row input");
			if($(this).prop("checked")){
				checkboxs.prop("checked",true);
			}else{
				checkboxs.prop("checked",false);
			}
		});
	},


	cleanup : function(){
		this.list = null;
		this.flag = null;
		this.panel.find("#file_filter_select option[value='all']").attr("selected",true);
		this.panel.find("#current_path").val("/");
		this.panel.find(".select-list").prop("checked",false);
	},

	showDialog : function(flag){
		var bodyWidth = $("body").width();
		var width = this.panel.find(".modal-dialog").width();
		if(bodyWidth < width){
			width = bodyWidth - 40;
			this.panel.find(".modal-dialog").css("width",width + "px");
		}
		this.cleanup();

		this.flag = flag;
		if(this.flag != null){
			this.panel.find(".btn-confirm").html("选择");
			this.panel.find(".btn-group-tool").css("display","none");
			this.panel.find("#current_path").parent().removeClass("col-md-8").addClass("col-md-12 col-xs-12");
		}else{
			this.panel.find(".btn-confirm").html("确定");
			this.panel.find(".btn-group-tool").css("display","block");
			this.panel.find("#current_path").parent().addClass("col-md-8 col-xs-8").removeClass("col-md-12 col-xs-12");
		}

		this.panel.modal();
		this.getList("/");
	},
	

	getList : function(path){
		MapCloud.notify.loading();
		fileManager.getList(path,this.getList_callback);
	},

	getList_callback : function(list){
		MapCloud.notify.hideLoading();
		var dialog = MapCloud.file_dialog;
		dialog.list = list;
		dialog.showListTree(list,true);
		var filterList = dialog.getFilterList();
		dialog.showListPanel(filterList);
	},

	// 刷新的获取列表
	getListRefresh : function(path){
		MapCloud.notify.loading();
		fileManager.getList(path,this.getListRefresh_callback);		
	},

	getListRefresh_callback : function(list){
		MapCloud.notify.showInfo("刷新","Info");
		var dialog = MapCloud.file_dialog;
		dialog.list = list;
		dialog.showListTree(list,true);
		var filterList = dialog.getFilterList();
		dialog.showListPanel(filterList);	
	},

	// 左侧的tree单击
	getListTreeClick : function(path){
		MapCloud.notify.loading();
		fileManager.getList(path,this.getListTreeClick_callback);
	},

	getListTreeClick_callback : function(list){
		MapCloud.notify.hideLoading();
		var dialog = MapCloud.file_dialog;
		dialog.list = list;
		var filterList = dialog.getFilterList();
		dialog.showListPanel(filterList);	
	},


	// 展示树
	showListTree : function(list,display){
		var l = null;
		// var path = null;
		var currentPath = null;
		var html = null;
		if(display == true){
			html = "<ul class='nav'>";
		}else{
			html = "<ul class='nav' style='display:none'>";
		}
		
		for(var i = 0; i< list.length; ++i){
			l = list[i];
			if(l == null){
				continue;
			}
			// if(currentPath == null){
			// 	currentPath = l.parPath;
			// }
			if(l instanceof GeoBeans.Folder){
				var name = l.name;
				html += "<li>"
				+ "<a href='javascript:void(0)' class='tree-folder' fpath=\"" + l.path + "\">"
				+ "<i class=\"fa fa-folder\"></i>"
				+ "<span>" + name + "</span>"
				+ "</a>"
				+ "</li>";
			}
		}	
		html += "</ul>";
		currentPath = this.panel.find("#current_path").val();
		var node = this.panel.find(".file-tree-div a[fpath='" + currentPath +"']");
		node.find("i").removeClass("fa-folder");
		node.find("i").addClass("fa-folder-open");
		node.parent().find("ul.nav").remove();
		node.after(html);

		var that = this;

	
		this.panel.find(".tree-folder").unbind("click");
		this.panel.find(".tree-folder").unbind("dblclick");

		var DELAY = 300, clicks = 0, timer = null;
		this.panel.find(".tree-folder").on("click", function(e){
			clicks++;  //count clicks
			if(clicks === 1) {
				var node = this;
			    timer = setTimeout(function() {
			        console.log("Single Click");  //perform single-click action    
			        var path = $(node).attr("fpath");
			        that.panel.find("#current_path").val(path);
					that.getListTreeClick(path);
					that.panel.find(".tree-folder").removeClass("selected");
					$(node).addClass("selected");
			        clicks = 0;             //after action performed, reset counter
			    }, DELAY);
			} else {
			    clearTimeout(timer);    //prevent single-click action
			    console.log("Double Click");  //perform double-click action
			    var path = $(this).attr("fpath");
		    	var parent = $(this).parent();
				if(parent.find("ul.nav").length != 0 && 
					parent.find("ul.nav").first().css("display") == "none"){
					parent.find("ul.nav").first().css("display","block");
					$(this).find("i").removeClass("fa-folder");
					$(this).find("i").addClass("fa-folder-open");
					that.getListTreeClick(path);
				}else if(parent.find("ul.nav").length != 0 && 
					parent.find("ul.nav").first().css("display") == "block"){
					parent.find("ul.nav").first().css("display","none");
					$(this).find("i").addClass("fa-folder");
					$(this).find("i").removeClass("fa-folder-open");
					that.getListTreeClick(path);
				}else {
					that.panel.find("#current_path").val(path);
					that.getList(path);
				}
				that.panel.find(".tree-folder").removeClass("selected");
				$(this).addClass("selected");
			    clicks = 0;             //after action performed, reset counter
			}

		}).on("dblclick", function(e){
			e.preventDefault();  //cancel system double-click event
		});
	},

	// 展示右侧面板
	showListPanel : function(list){
		var l = null;
		var html = "";
		this.panel.find(".select-list").prop("checked",false);
		for(var i = 0; i < list.length; ++i){
			l = list[i];
			if(l == null){
				continue;
			}
			if(l instanceof GeoBeans.File){
				var name = l.name;
				var accessTime = l.accessTime;
				var lastTime = l.lastTime;
				var size = l.size;
				var path = l.path;
				

				html += "<div class='row row-file' fpath='" + path + "'>"
				+ "<div class='col-md-1 col-xs-1 row'>"
				+ "<div class='col-md-6 col-xs-6'>"

				if(this.flag == "choose-shp"){
					var fileFix = name.slice(name.lastIndexOf(".")+1,name.length);
					if(fileFix.toLowerCase() == "shp"){
						html += "		<input type='checkbox' name='" + name + "'>";
					}else{
						html += "		<input type='checkbox' name='" + name + "' disabled>";
					}
				}else if(this.flag == "image"){
					var fileFix = name.slice(name.lastIndexOf(".")+1,name.length);
					fileFix = fileFix.toLowerCase();
					var filterArray = ["jpeg","jpg","tif","png"];
					if(filterArray.indexOf(fileFix) != -1){
						html += "		<input type='checkbox' name='" + name + "'>";
					}else{
						html += "		<input type='checkbox' name='" + name + "' disabled>";
					}
				}else if(this.flag == "csv" || this.flag == "csvImport"){
					var fileFix = name.slice(name.lastIndexOf(".")+1,name.length);
					if(fileFix.toLowerCase() == "csv"){
						html += "		<input type='radio' name='csv'>";
					}else{
						html += "		<input type='radio' name='csv' disabled>";
					}
				}else{
					html += "		<input type='checkbox' name='" + name + "'>";
				}
				html += "</div>"
				+ 	"<div class='col-md-6 col-xs-6'>"
				+ 	"<i class='fa fa-file-o'></i>"
				+ 	"</div>";

				html+= "</div>"
				+ "<div class='col-md-3 col-xs-3 row-fname'>"
				// + "		<i class='fa fa-file-o'></i>"
				+ "		<span>" + name + "</span>"
				+ "</div>"
				+ "<div class='col-md-1 col-xs-1'>文件</div>"
				+ "<div class='col-md-3 col-xs-3'>" + accessTime + "</div>"
				+ "<div class='col-md-3 col-xs-3'>" + lastTime + "</div>"
				+ "<div class='col-md-1 col-xs-1'>" + size + "</div>"
				+ "</div>";
			}else if(l instanceof GeoBeans.Folder){
				var name = l.name;
				var accessTime = l.accessTime;
				var lastTime = l.lastTime;
				var path = l.path;
				html += "<div class='row row-folder' fpath='" + path + "'>"
				+ "<div class='col-md-1 col-xs-1 row'>"
				+ "<div class='col-md-6 col-xs-6'>";

				if(this.flag == null ){
					html += "	<input type='checkbox' name='" + name + "'>"
				}else{
					html += "	<input type='checkbox' name='" + name + "' disabled>"
				}
				html += "</div>"
				+ 	"<div class='col-md-6 col-xs-6'>"
				+ 	"<i class='fa fa-folder'></i>"
				+ 	"</div>";
				
				html += "</div>"
				+ "<div class='col-md-3 col-xs-3 row-fname'>"
				// + "		<i class='fa fa-folder-o'></i>"
				+ "		<span>" + name + "</span>"
				+ "</div>"
				+ "<div class='col-md-1 col-xs-1'>文件夹</div>"
				+ "<div class='col-md-3 col-xs-3'>" + accessTime + "</div>"
				+ "<div class='col-md-3 col-xs-3'>" + lastTime + "</div>"
				+ "<div class='col-md-1 col-xs-1'></div>"
				+ "</div>";			
			}
		}
		this.panel.find(".file-list-content-div").html(html);

		var that = this;
		this.panel.find(".row-folder .row-fname").click(function(){
			var path = $(this).parent().attr("fpath");
			// var path = $(this).attr("fpath");
			that.panel.find(".tree-folder").removeClass("selected");
			var node = that.panel.find(".tree-folder[fpath='" + path + "']");
			node.parents(".nav").first().css("display","block");
			node.addClass("selected");
			that.panel.find("#current_path").val(path);
			that.getList(path);
		});

		// this.panel.find(".row-file .row-fname").dblclick(function(){
		// 	var text = $(this).find("span").html();
		// 	var html = "<input type='text' value='" + text + "'>";
		// 	$(this).html(html);
		// 	var that = this;
		// 	$(this).find("input").focusout(function(){
		// 		var value = $(this).val();
		// 		$(this).parent().html("<span>" + value + "</span>");
		// 	});
		// });
	},



	setCreateFolderName: function(name){
		var currentPath = this.panel.find("#current_path").val();
		var path = null;
		if(currentPath == "/"){
			path = "/" + name;
		}else{
			path = currentPath + "/" + name;
		}
		this.createFolder(path);
	},

	// 新建文件夹
	createFolder : function(path){
		MapCloud.notify.loading();
		fileManager.createFolder(path,this.createFolder_callback);
	},

	createFolder_callback : function(result){
		var info = "新建文件夹";
		// MapCloud.notify.showInfo(result,info);
		MapCloud.notify.showInfo(result,info);
		var dialog = MapCloud.file_dialog;
		var currentPath = dialog.panel.find("#current_path").val();
		dialog.getList(currentPath);
	},

	// 删除文件
	removeFile : function(path){
		fileManager.removeFile(path,this.removeFile_callback);
	},

	removeFile_callback : function(result){
		var info = "删除文件";
		MapCloud.notify.showInfo(result,info);
		var dialog = MapCloud.file_dialog;
		var currentPath = dialog.panel.find("#current_path").val();
		dialog.getList(currentPath);		
	},

	// 删除文件夹
	removeFolder : function(path){
		fileManager.removeFolder(path,this.removeFolder_callback);
	},

	removeFolder_callback : function(result){
		var info = "删除文件夹";
		MapCloud.notify.showInfo(result,info);
		var dialog = MapCloud.file_dialog;
		var currentPath = dialog.panel.find("#current_path").val();
		dialog.panel.find(".tree-folder[fpath='" + currentPath +"']").next().remove();
		dialog.getList(currentPath);
	},

	// 刷新当前页面
	refreshCurrentPath : function(){
		var currentPath = this.panel.find("#current_path").val();
		this.getList(currentPath);
	},

	getFilterList : function(){
		var value = this.panel.find("#file_filter_select").val();
		var filterValues = value.split(",");
		if(filterValues.length == 0){
			return this.list;
		}
		if(filterValues.length == 1 && filterValues[0] == "all"){
			return this.list;
		}
		var l = null;
		var filter = null;
		var name = null;
		var filterList = [];
		for(var i = 0; i < this.list.length; ++i){
			l = this.list[i];
			if(l instanceof GeoBeans.Folder){
				filterList.push(l);
			}else if(l instanceof GeoBeans.File){
				name = l.name;
				name = name.toLowerCase();
				for(var j = 0; j < filterValues.length; ++j){
					filter = filterValues[j];
					filter = "." + filter;
					if(name.length <= filter.length){
						continue;
					}
					if(name.lastIndexOf(filter) == (name.length - filter.length)){
						filterList.push(l);
					}
				}
			}
		}
		return filterList;
	},


	// 获得要上传的文件的路径
	getImportPaths : function(){
		var checkboxs = this.panel.find("input[type='checkbox']:checked");
		var checkbox = null;
		var paths = [];
		for(var i = 0; i < checkboxs.length; ++i){
			checkbox = checkboxs[i];
			if(checkbox == null){
				continue;
			}
			var path = $(checkbox).parents(".row-file").attr("fpath");
			if(path != null){
				paths.push(path);
			}
		}
		return paths;
	},

	// 获取csv文件的路径
	getImportCSVPath : function(){
		var radio = this.panel.find("input[name='csv']:checked");
		if(radio.length == 0){
			return null;
		}
		var path = radio.parents(".row-file").attr("fpath");
		return path;
	}

});
	