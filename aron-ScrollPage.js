/**
 * Created on 2014/12/23
 * author aron_阿伦
 * QQ:398155437
 * [ScrollPage description]
 * @param  {[type]} ele [description]
 * @return {[type]}        [description]
 */
(function(undefined){
	var dummyStyle = document.createElement('div').style;
	var	vendor = (function(){
	        var vendors = ['webkitT','MozT','msT','OT','t'],
	            t,
	            i = 0,
	            l = vendors.length;

	        for ( ; i < l; i++ ) {
	            t = vendors[i] + 'ransform';
	            if ( t in dummyStyle ) {
	                return vendors[i].substr(0, vendors[i].length - 1);
	            }
	        }
	        return false;
	    })();

	var cH,transform,scale;
	function initParam()
	{
		cH = this.docEleH;
		transform = "all " +this.duration/1000+ "s";
		scale = 1/(1-this.scale);
	}

	function ScrollPage(ele){
		this.ele = ele;
		this.ele.style.height = document.documentElement.clientHeight+"px";
	}

	ScrollPage.prototype = {
		init : function(config)
		{
			this.initData(config?config : {});
			this.bindEvent();
			//兼容快速滑动出现的闪屏
			addEventHandler(document,isPC()?"mousedown":"touchstart",function(e){
				e.preventDefault();
			});
		},
		initData : function(config)
		{
			var that = this;
			this.pages = this.ele.querySelectorAll(".page");
			this.docEleH = document.documentElement.clientHeight;
			this.pageNow = 1;
			this.usingScale = true;
			this.isPc = isPC();
			this.moved = false;
			this.isMoving = false;
			this.fn_afterSliding = [];//滑动完成后
			this.fn_touchSliding = [];//触摸状态滑动开始
			this.fn_startSlideToPage = [];//触摸滑动放开手指并开始换页时
			this.scrollSuccess = false;
			this.duration = 500;//500ms -> 0.5s
			this.scale = 0.8;
			this.threshold = 100;
			this.fn_initCallback = function(){
				console.log("init plugin success");
			}
			this.setData(config);
		},
		setData : function(config)
		{
			function setFn(keyName,index,fn_default)
			{
				if(keyName in config)
				{
					if(config[keyName][index] && typeof config[keyName][index] == "function")
					{
						return config[keyName][index];
					}
				}
				return fn_default;
			}
			for(var i=0; i< this.pages.length; i++)
			{
				this.fn_touchSliding.push((function(index){
					return setFn("fn_touchSliding", index, function(){
						console.log("默认事件--手指触摸滑动当前页开始,准备切换到第 " + (index+1) + " 页");
					});
				})(i));
				
				this.fn_startSlideToPage.push((function(index){
					return setFn("fn_startSlideToPage", index, function(){
						console.log("默认事件--自动切换至第 " + (index+1)+ " 页");
					});
				})(i));

				this.fn_afterSliding.push((function(index){
					return setFn("fn_afterSliding", index, function(){
						console.log("默认事件--完成滑动到第 " + (index+1) + " 页");
					});
				})(i));
			}
			"duration" in config ? this.duration = config.duration:"";
			"usingScale" in config ? this.usingScale = !!config.usingScale:"";
			"scale" in config ? parseFloat(config.scale)>0 && parseFloat(config.scale)<1? (this.scale = parseFloat(config.scale)):"":"";
			"threshold" in config ? this.threshold = config.threshold:"";
			"fn_initCallback" in config? this.fn_initCallback = config.fn_initCallback:"";
			this.fn_initCallback();
			initParam.call(this);
		},
		bindEvent : function()
		{
			var that = this;
			function bindMD(e){
				that.mousedown.call(that,e,bindMM);
			}

			function bindMU(e){
				that.mouseup.call(that,e,bindMM);
			}

			function bindMM(e)
			{
				that.mousemove.call(that,e);
			}
			addEventHandler(this.ele,this.isPc?"mousedown":"touchstart",bindMD);
			addEventHandler(this.ele,this.isPc?"mouseup":"touchend",bindMU);
		},
		mousedown : function(e,fnMouseMove)
		{	

			if(this.moved)
			{
				return false;
			}
			e.stopPropagation();
			this.setTransition("");
			this.setPagesIndex();
			this.originClientY = this.isPc? e.clientY : e.targetTouches[0].clientY;
			var that = this;
			addEventHandler(this.ele,this.isPc?"mousemove":"touchmove",fnMouseMove);
		},
		mouseup : function(e,fnMouseMove)
		{
			//未滑动页面时候跳出
			if(!this.moved)
			{	
				removeEventHandler(this.ele,this.isPc?"mousemove":"touchmove",fnMouseMove);
				return false;
			}
			//防止切换页面期间多次点击，触发up事件取消定时器
			if(this.isMoving)
			{	
				return false;
			}
			
			var that = this;
			this.isMoving = true;
			this.setTransition(transform);
			//var offset = this.pages[this.pageNow-1].style.transform.match(/\-?[0-9]+\.?[0-9]*/g);
			var offset = this.pages[this.pageNow-1].style[vendor+"Transform"].split("px, ")
			clearTimeout(this.timer);
			//var scale = 1/(1-this.scale);
			if(offset && Math.abs(offset[1])>this.threshold/(this.usingScale?scale:1))
			{
				//scroll next or previous page
				if(this.direction == "next")
				{
					this.usingScale?setTranCss.call(this.pages[this.pageNow-1],(-cH)/scale,transform,this.scale):setTranCss.call(this.pages[this.pageNow-1],-cH,transform);
					setTranCss.call(this.pages[this.pageNow],0);
					that.pageNow++;
				}else
				{
					this.usingScale?setTranCss.call(this.pages[this.pageNow-1],cH/scale,transform,this.scale):setTranCss.call(this.pages[this.pageNow-1],cH,transform);
					setTranCss.call(this.pages[this.pageNow-2],0);
					that.pageNow--;
				}
				this.scrollSuccess = true;
				this.fn_startSlideToPage[this.pageNow-1]();
			}else
			{
				//revert to current page
				if(this.direction == "next" && this.pageNow < this.pages.length)
				{
					setTranCss.call(this.pages[this.pageNow-1],0);
					setTranCss.call(this.pages[this.pageNow],cH);
				}else if(this.pageNow >1)
				{
					setTranCss.call(this.pages[this.pageNow-1],0);
					setTranCss.call(this.pages[this.pageNow-2],-cH);
				}
				this.scrollSuccess = false;
			}

			this.revertCallback();
			removeEventHandler(this.ele,this.isPc?"mousemove":"touchmove",fnMouseMove);
		},
		mousemove : function(evt)
		{
			if(this.isMoving)
			{
				return false;
			}
			evt.preventDefault();
			
			this.isPc?"":(evt.clientY = evt.targetTouches[0].clientY);
			if(this.originClientY < evt.clientY && this.pageNow >1)
			{
				this.direction != "prev" ? this.fn_touchSliding[this.pageNow-2]():"";

				this.moved = true;
				//direction previous
				this.direction = "prev";
				this.usingScale?setTranCss.call(this.pages[this.pageNow-1],(evt.clientY -this.originClientY)*(1-this.scale),"",(1-(1-this.scale)*(evt.clientY -this.originClientY)/cH)):setTranCss.call(this.pages[this.pageNow-1],(evt.clientY -this.originClientY));
				addClass(this.pages[this.pageNow-2],"active");
				setTranCss.call(this.pages[this.pageNow-2],(-cH - (this.originClientY -evt.clientY )));
				//for sake of compatibility,better UE
				this.pageNow<this.pages.length?removeClass(this.pages[this.pageNow],'active'):"";
			}
			else if(this.originClientY > evt.clientY && this.pageNow < this.pages.length)
			{
				this.direction != "next"?this.fn_touchSliding[this.pageNow]():"";

				this.moved = true;
				//direction next
				this.direction = "next";
				this.usingScale?setTranCss.call(this.pages[this.pageNow-1],(evt.clientY -this.originClientY)*(1-this.scale),"",(1+(1-this.scale)*(evt.clientY -this.originClientY)/cH)):setTranCss.call(this.pages[this.pageNow-1],(evt.clientY -this.originClientY));
				addClass(this.pages[this.pageNow],"active");
				setTranCss.call(this.pages[this.pageNow],cH - (this.originClientY - evt.clientY));
				//for sake of compatibility,better UE
				this.pageNow>1?removeClass(this.pages[this.pageNow-2],'active'):"";
			}else
			{
				this.direction = "";
				//for sake of compatibility,better UE
				if(this.pageNow == 1)
				{
					removeClass(this.pages[1],'active');
					setTranCss.call(this.pages[0],0);

				}else if(this.pageNow == this.pages.length)
				{
					setTranCss.call(this.pages[this.pages.length-1],0);
					removeClass(this.pages[this.pages.length-2],'active');
				}
			}
		},
		revertPages : function()
		{
			for(var i=0;i<this.pages.length; i++)
			{
				this.pages[i].style[vendor+"Transform"] = "";
				this.pages[i].style[vendor+"Transition"] = "";
				this.pages[i].style.zIndex = "";
				if(i+1 == this.pageNow)
				{
					continue;
				}
				removeClass(this.pages[i],'active');
			}
		},
		setTransition : function(value)
		{
			for(var i =0; i<this.pages.length; i++)
			{
				this.pages[i].style[vendor+"Transition"] = value;
			}
		},
		setPagesIndex : function()
		{
			if(this.pageNow >1 && this.pageNow<this.pages.length)
			{
				this.pages[this.pageNow-1].style.zIndex=0;
				this.pages[this.pageNow-2].style.zIndex=1;
			}else if(this.pageNow  == this.pages.length)
			{
				this.pages[this.pageNow-1].style.zIndex=0;
				this.pages[this.pageNow-2].style.zIndex=1;
			}
			
		},
		_autoScrollPage : function(fn)
		{
			if(this.direction == "next" && (this.pageNow >= this.pages.length || this.isMoving))
			{
				return false;
			}
			if(this.direction == "prev" && (this.pageNow <= 1 || this.isMoving))
			{
				return false;
			}
			this.setPagesIndex();
			this.isMoving = true;
			fn.call(this);
			var that = this;
			setTimeout(function(){
					setTranCss.call(that.pages[that.pageNow-1],0,transform);
				},30);
			this.scrollSuccess = true;
			this.revertCallback();
			this.fn_startSlideToPage[this.pageNow-1]();
			return true;
		},
		toNextPage : function()
		{
			this.direction = "next";
			return this._autoScrollPage(function(){
				setTranCss.call(this.pages[this.pageNow],cH);
				addClass(this.pages[this.pageNow],"active");
				this.usingScale?setTranCss.call(this.pages[this.pageNow-1],(-cH)/scale,transform,this.scale):setTranCss.call(this.pages[this.pageNow-1],-cH,transform);
				this.pageNow++;
			});
		},
		toPrevPage : function()
		{	
			this.direction = "prev";
			return this._autoScrollPage(function(){
				this.usingScale?setTranCss.call(this.pages[this.pageNow-1],cH/scale,transform,this.scale):setTranCss.call(this.pages[this.pageNow-1],cH,transform);
				addClass(this.pages[this.pageNow-2],"active");
				setTranCss.call(this.pages[this.pageNow-2],-cH);
				this.pageNow--;
			});
		},
		revertCallback : function()
		{
			var that = this;
			this.timer = setTimeout(function(){
						that.revertPages();
						that.moved = false;
						that.isMoving = false;
						that.scrollSuccess?that.fn_afterSliding[that.pageNow-1]():"";
						this.timer = 0;
						that.direction = "";
						that.scrollSuccess = false;
					},this.duration);
		}
	}

	/**
	 * [setTranCss description]
	 * @param {[type]} offsetY    [description]
	 * @param {[type]} transition [description]
	 */
	function setTranCss()
	{
		var transStart = "translate3d(0px,", transEnd = ",0)";
		if(arguments.length == 0)
		{
			this.style[vendor+"Transform"] = transStart + 0 + "px" + transEnd;
		}
		else if(arguments.length == 1)
		{
			this.style[vendor+"Transform"] = transStart + arguments[0] + "px" + transEnd;
		}
		else if(arguments.length ==2 )
		{
			this.style[vendor+"Transform"] = transStart + arguments[0] + "px" + transEnd;
			this.style[vendor+"Transition"] = arguments[1];
		}else if(arguments.length == 3 )
		{
			this.style[vendor+"Transform"] = transStart + arguments[0] + "px" + transEnd + " scale(" + arguments[2]+")";
			this.style[vendor+"Transition"] = arguments[1];
		}
			this.style[vendor+"TransitionTimingFunction"] = "ease-in-out";

	}

	function addClass(ele, className)
	{
		var eleClass = ele.getAttribute("class");
		var arr = eleClass.split(" ");
		for(var i=0; i<arr.length; i++)
		{
			if(arr[i] == className)
			{
				return false;
			}
		}
		ele.setAttribute("class",arr.join(" ") + " " + className);
	}

	function removeClass(ele, className)
	{
		var eleClass = ele.getAttribute("class");
		var arr = eleClass.split(" ");
		var newClassArr = [];
		for(var i=0; i<arr.length; i++)
		{
			if(arr[i] != className)
			{
				newClassArr.push(arr[i]);
			}
		}
		ele.setAttribute("class",newClassArr.join(" "));
	}

	function addEventHandler(target, type, func) {
		if (target.addEventListener) {
			target.addEventListener(type, func, false);
		} else if (target.attachEvent) {
			target.attachEvent("on" + type, func);
		} else {
			target["on" + type] = func;
		}
	}

	function removeEventHandler(target, type, func) {  
	    if (target.removeEventListener){  
	        //监听IE9，谷歌和火狐  
	        target.removeEventListener(type, func, false);  
	    } else if (target.detachEvent){  
	        target.detachEvent("on" + type, func);  
	    }else {  
	        delete target["on" + type];  
	    }  
	}

	function isPC()
	{
		var userAgentInfo = navigator.userAgent;
	    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
	    var flag = true;
	    for (var v = 0; v < Agents.length; v++) {
	        if (userAgentInfo.indexOf(Agents[v]) > 0) { flag = false; break; }
	    }
	    return flag;
	}

	window.ScrollPage = ScrollPage;
})(undefined)
