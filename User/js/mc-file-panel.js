MapCloud.FilePanel = MapCloud.Class({
	panel : null,

	initialize : function(id){
		this.panel = $('#' + id);
		this.registerPanelEvent();
		this.getList("/");
	},

	registerPanelEvent : function(){
		var that = this;
		// 新建目录
		this.panel.find(".add-folder").click(function(){
			MapCloud.create_folder_dialog.showDialog("file-user");
		});

		// 删除目录
		this.panel.find(".remove-file").click(function(){
			that.removeFileFolder();
		});

		// 刷新目录
		this.panel.find(".refresh-folder").click(function(){
			var path = that.panel.find("#current_path").val();
			that.getListRefresh(path);	
		});

		// 上传文件
		this.panel.find(".upload-file").click(function(){
			var currentPath = that.panel.find("#current_path").val();
			MapCloud.importVector_dialog.showDialog(currentPath,"file-user");
		});
	},


	getList : function(path){
		MapCloud.notify.loading();
		fileManager.getList(path,this.getList_callback);
	},

	getList_callback : function(list){
		MapCloud.notify.hideLoading();
		var that = MapCloud.filePanel;
		that.list = list;
		that.showListTree(list,true);
		var filterList = that.getFilterList();
		that.showListPanel(filterList);
	},

	// 进行过滤
	getFilterList : function(){
		// var value = this.panel.find("#file_filter_select").val();
		var value = "all";
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

	// 左侧的tree单击
	getListTreeClick : function(path){
		MapCloud.notify.loading();
		fileManager.getList(path,this.getListTreeClick_callback);
	},

	getListTreeClick_callback : function(list){
		MapCloud.notify.hideLoading();
		var that = MapCloud.filePanel;
		that.list = list;
		var filterList = that.getFilterList();
		that.showListPanel(filterList);	
	},

	// 设置新建文件夹名称
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
		MapCloud.notify.showInfo(result,info);
		var that = MapCloud.filePanel;
		var currentPath = that.panel.find("#current_path").val();
		that.getList(currentPath);
	},	

	// 删除文件，文件夹
	removeFileFolder : function(){
		var that = this;
		var checkboxs = that.panel.find("input[type='checkbox']:checked");
		if(checkboxs.length == 0){
			var path = that.panel.find(".tree-folder.selected").attr("fpath");
			if(path == "/"){
				MapCloud.notify.showInfo("无法删除根目录","Warning");
				return;
			}
			var folderName = that.panel.find(".tree-folder.selected span").html();
			if(!confirm("确定要删除文件夹[" + folderName + "]?")){
				return;
			}
			// 更改为上一级对话框
			var parentNode = that.panel.find(".tree-folder.selected").parents(".nav").first().prev();
			that.panel.find(".tree-folder.selected").parents(".nav").first().remove();
			that.panel.find(".tree-folder").removeClass("selected");
			parentNode.addClass("selected");
			var parentPath = parentNode.attr("fpath");
			that.panel.find("#current_path").val(parentPath);

			that.removeFolder(path);
			return;
		}
		if(!confirm("确定要删除吗？")){
			return;
		}
		checkboxs.each(function(){
			var parent = $(this).parent().parent().parent();
			var path = parent.attr("fpath");
			if(parent.hasClass("row-file")){
				that.removeFile(path);
			}else if(parent.hasClass("row-folder")){
				that.removeFolder(path);
			}
		});
	},

	// 删除文件
	removeFile : function(path){
		fileManager.removeFile(path,this.removeFile_callback);
	},

	removeFile_callback : function(result){
		var info = "删除文件";
		MapCloud.notify.showInfo(result,info);
		var that = MapCloud.filePanel;
		var currentPath = that.panel.find("#current_path").val();
		that.getList(currentPath);		
	},	

	// 删除文件夹
	removeFolder : function(path){
		fileManager.removeFolder(path,this.removeFolder_callback);
	},

	removeFolder_callback : function(result){
		var info = "删除文件夹";
		MapCloud.notify.showInfo(result,info);
		var that = MapCloud.filePanel;
		var currentPath = that.panel.find("#current_path").val();
		that.panel.find(".tree-folder[fpath='" + currentPath +"']").next().remove();
		that.getList(currentPath);
	},

	// 刷新的获取列表
	getListRefresh : function(path){
		MapCloud.notify.loading();
		fileManager.getList(path,this.getListRefresh_callback);		
	},

	getListRefresh_callback : function(list){
		MapCloud.notify.showInfo("刷新","Info");
		var that = MapCloud.filePanel;
		that.list = list;
		that.showListTree(list,true);
		var filterList = that.getFilterList();
		that.showListPanel(filterList);	
	},

	// 刷新当前页面
	refreshCurrentPath : function(){
		var currentPath = this.panel.find("#current_path").val();
		this.getList(currentPath);
	},
});