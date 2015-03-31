/**
 * Created on 2014/12/23
 * author aron_阿伦
 * QQ:398155437
 * [aScrollPage description]
 * @param  {[type]} ele [description]
 * @return {[type]}        [description]
 */
(function(window,undefined){
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
	var _pageInfo = {originalPageIndex : 1, finalPageIndex : 2};
	var cH,transform,scale;
	function initParam()
	{
		cH = this.docEleH;
		transform = "all " +this.duration/1000+ "s";
		scale = 1/(1-this.scale);
	}

	function aScrollPage(ele){
		return new aScrollPage.prototype._init(ele);
	}

	aScrollPage.prototype = {
		_init : function(ele){
			this.ele = ele;
			this.ele.style.height = document.documentElement.clientHeight+"px";
			this.ele.style[vendor+"Transform"] = "translate3d(0px,0,0)";
			return this;
		},
		init : function(config)
		{
			this.initData(config?config : {});
			this.bindEvent();
			//兼容快速滑动出现的闪屏
			addEventHandler(document,isPC()?"mousedown":"touchstart",function(e){
				e.preventDefault();
			});
			return this;
		},
		initData : function(config)
		{
			var that = this;
			this.pages = this.ele.querySelectorAll(".page");
			this.docEleH = document.documentElement.clientHeight;
			this.revertImmediately = false;//是否立即执行恢复函数revertCallback
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
			this.mode = "scale";//默认换页效果为缩放换页
			this.scale = 0.8;
			this.threshold = 100;
			this.slideMode = "normal";
			this.allowToNext = true;
			this.allowToPrev = true;
			this.fn_initCallback = function(){
				console.log("init plugin success");
			}
			this.cb_afterSliding = function(){
				console.log("默认全局回调事件 -- 完成滑动。");
			}
			this.cb_touchSliding = function(){
				console.log("默认全局回调事件 -- 触摸状态滑动开始。");
			}
			this.cb_startSlideToPage = function(){
				console.log("默认全局回调事件 -- 触摸滑动放开手指并开始换页时。");
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
						console.log("默认指定页面事件--手指触摸滑动当前页开始,准备切换到第 " + (index+1) + " 页");
					});
				})(i));
				
				this.fn_startSlideToPage.push((function(index){
					return setFn("fn_startSlideToPage", index, function(){
						console.log("默认指定页面事件--自动切换至第 " + (index+1)+ " 页");
					});
				})(i));

				this.fn_afterSliding.push((function(index){
					return setFn("fn_afterSliding", index, function(){
						console.log("默认指定页面事件--完成滑动到第 " + (index+1) + " 页");
					});
				})(i));
			}
			"duration" in config ? this.duration = config.duration:"";
			"slideMode" in config && config.slideMode == "static"? this.slideMode = "static" : "";
			"usingScale" in config ? this.usingScale = !!config.usingScale:"";
			"scale" in config ? parseFloat(config.scale)>0 && parseFloat(config.scale)<=1? (this.scale = parseFloat(config.scale)):"":"";
			if("mode" in config){
				if(config.mode == "normal")
				{
					this.usingScale = false;
				}
				else if(config.mode == "static")
				{
					this.usingScale  = true;
					this.scale = 1;
				}
			}
			"threshold" in config ? this.threshold = config.threshold:"";
			"fn_initCallback" in config? this.fn_initCallback = config.fn_initCallback:"";
			"cb_afterSliding" in config && typeof config.cb_afterSliding == "function"? this.cb_afterSliding = config.cb_afterSliding:"";
			"cb_touchSliding" in config && typeof config.cb_touchSliding == "function"? this.cb_touchSliding = config.cb_touchSliding:"";
			"cb_startSlideToPage" in config && typeof config.cb_startSlideToPage == "function"? this.cb_startSlideToPage = config.cb_startSlideToPage:"";
			initParam.call(this);
			this.fn_initCallback.call(this);
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
			_pageInfo.originalPageIndex = this.pageNow;
			if(this.moved)
			{
				return false;
			}
			this.slideMode == "static" ?this.needToScroll = true :"";
			e.stopPropagation();
			this.setTransition("");
			this.setPagesIndex();
			this.originClientY = this.isPc? e.clientY : e.targetTouches[0].clientY;
			var that = this;
			addEventHandler(this.ele,this.isPc?"mousemove":"touchmove",fnMouseMove);
		},
		mouseup : function(e,fnMouseMove)
		{
			removeEventHandler(this.ele,this.isPc?"mousemove":"touchmove",fnMouseMove);

			
			//未滑动页面时候跳出
			if(!this.moved)
			{	
				//removeEventHandler(this.ele,this.isPc?"mousemove":"touchmove",fnMouseMove);
				return false;
			}
			//防止切换页面期间多次点击，触发up事件取消定时器
			if(this.isMoving)
			{	
				return false;
			}
			/* slideMode为 static*/
			if(this.slideMode =="static" && this.needToScroll)
			{
				//removeEventHandler(this.ele,this.isPc?"mousemove":"touchmove",fnMouseMove);
				this.scrollByDirection();
				this.needToScroll = false;
				return false;
			}

			this.isMoving = true;
			this.slideMode !="static"?this.setTransition(transform):"";
			clearTimeout(this.timer);
			//var offset = this.pages[this.pageNow-1].style.transform.match(/\-?[0-9]+\.?[0-9]*/g);
			//this.direction == "next"?this.pageNow?this.pageNow-2
			/*
			var offset = this.pages[this.pageNow-1].style[vendor+"Transform"].split("px, ")
			console.log(offset)
			if(offset && Math.abs(offset[1])>this.threshold/(this.usingScale?scale:1))
			*/
			var offset = this.pageNow ==1 && this.direction=="" ?"" : this.pages[this.direction == "next"?this.pageNow:this.pageNow-2].style[vendor+"Transform"].split("px, ");
			var offsetH = cH,pageNowIndex = this.pageNow-1,pageNextIndex;
			if(offset && cH - Math.abs(offset[1])>this.threshold)
			{
				//scroll next or previous page
				if(this.direction == "next")
				{
					pageNextIndex = this.pageNow;
					offsetH = -cH;
					this.pageNow++;
				}
				else
				{
					pageNextIndex = this.pageNow-2;
					this.pageNow--;
				}
				this.usingScale?setTranCss(this.pages[pageNowIndex],offsetH/scale,transform,this.scale):setTranCss(this.pages[pageNowIndex],offsetH,transform);
				setTranCss(this.pages[pageNextIndex],0);
				this.scrollSuccess = true;
				_pageInfo.finalPageIndex = this.pageNow;
				this.cb_startSlideToPage.call(this,_pageInfo);
				this.fn_startSlideToPage[this.pageNow-1].call(this);
			}
			else
			{
				//revert to current page
				if(this.direction == "next" && this.pageNow < this.pages.length)
				{
					setTranCss(this.pages[this.pageNow-1],0);
					setTranCss(this.pages[this.pageNow],cH);
				}else if(this.pageNow >1)
				{
					setTranCss(this.pages[this.pageNow-1],0);
					setTranCss(this.pages[this.pageNow-2],-cH);
				}
				this.scrollSuccess = false;
			}
			this.revertCallback();
			//removeEventHandler(this.ele,this.isPc?"mousemove":"touchmove",fnMouseMove);
		},
		mousemove : function(evt)
		{
			if(this.isMoving)
			{
				return false;
			}
			this.isPc?"":(evt.clientY = evt.targetTouches[0].clientY);

			//判断是否允许滑动
			if(!this.isScrollable(evt))
			{
				return false;
			}

			evt.preventDefault();
			if(this.originClientY < evt.clientY && this.pageNow >1)
			{
				
				//this.direction != "prev" ? this.fn_touchSliding[this.pageNow-2].call(this):"";
				if(this.direction != "prev")
				{
					_pageInfo.finalPageIndex = this.pageNow-1;
					this.cb_touchSliding.call(this,_pageInfo);
					this.fn_touchSliding[this.pageNow-2].call(this);
				}
				this.moved = true;
				//direction previous
				this.direction = "prev";
				this.usingScale?setTranCss(this.pages[this.pageNow-1],(evt.clientY -this.originClientY)*(1-this.scale),"",(1-(1-this.scale)*(evt.clientY -this.originClientY)/cH)):setTranCss(this.pages[this.pageNow-1],(evt.clientY -this.originClientY));
				addClass(this.pages[this.pageNow-2],"active");
				setTranCss(this.pages[this.pageNow-2],(-cH - (this.originClientY -evt.clientY )));
				//for sake of compatibility,better UE
				this.pageNow<this.pages.length?removeClass(this.pages[this.pageNow],'active'):"";
			}
			else if(this.originClientY > evt.clientY && this.pageNow < this.pages.length)
			{
				//this.direction != "next"?this.fn_touchSliding[this.pageNow].call(this):"";
				if(this.direction != "next")
				{
					_pageInfo.finalPageIndex = this.pageNow+1;
					this.cb_touchSliding.call(this,_pageInfo);
					this.fn_touchSliding[this.pageNow].call(this);
				}
				this.moved = true;
				//direction next
				this.direction = "next";
				this.usingScale?setTranCss(this.pages[this.pageNow-1],(evt.clientY -this.originClientY)*(1-this.scale),"",(1+(1-this.scale)*(evt.clientY -this.originClientY)/cH)):setTranCss(this.pages[this.pageNow-1],(evt.clientY -this.originClientY));
				addClass(this.pages[this.pageNow],"active");
				setTranCss(this.pages[this.pageNow],cH - (this.originClientY - evt.clientY));
				//for sake of compatibility,better UE
				this.pageNow>1?removeClass(this.pages[this.pageNow-2],'active'):"";
			}else
			{
				this.direction = "";
				//for sake of compatibility,better UE
				if(this.pageNow == 1)
				{
					removeClass(this.pages[1],'active');
					setTranCss(this.pages[0],0);

				}else if(this.pageNow == this.pages.length)
				{
					setTranCss(this.pages[this.pages.length-1],0);
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
			_pageInfo.originalPageIndex = this.pageNow;
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
			var that = this,delay = 30;
			setTimeout(function(){
					if(that.direction == "next")
					{
						that.usingScale?setTranCss(that.pages[that.pageNow-1],(-cH)/scale,transform,that.scale):setTranCss(that.pages[that.pageNow-1],-cH,transform);
						that.pageNow++;
					}
					else if(that.direction == "prev")
					{
						that.usingScale?setTranCss(that.pages[that.pageNow-1],cH/scale,transform,that.scale):setTranCss(that.pages[that.pageNow-1],cH,transform);
						that.pageNow--;
					}
					setTranCss(that.pages[that.pageNow-1],0,transform);
					_pageInfo.finalPageIndex = that.pageNow;
					that.cb_startSlideToPage.call(that,_pageInfo);
					that.fn_startSlideToPage[that.pageNow-1].call(that);
				},delay);
			this.scrollSuccess = true;
			this.revertCallback(delay);
			
			
			return true;
		},
		toNextPage : function()
		{
			this.direction = "next";
			return this._autoScrollPage(function(){
				setTranCss(this.pages[this.pageNow],cH);
				addClass(this.pages[this.pageNow],"active");
				//this.usingScale?setTranCss(this.pages[this.pageNow-1],(-cH)/scale,transform,this.scale):setTranCss(this.pages[this.pageNow-1],-cH,transform);
				//this.pageNow++;
			});
		},
		toPrevPage : function()
		{	
			this.direction = "prev";
			return this._autoScrollPage(function(){
				//this.usingScale?setTranCss(this.pages[this.pageNow-1],cH/scale,transform,this.scale):setTranCss(this.pages[this.pageNow-1],cH,transform);
				addClass(this.pages[this.pageNow-2],"active");
				setTranCss(this.pages[this.pageNow-2],-cH);
				//this.pageNow--;
			});
		},
		revertCallback : function()
		{
			var that = this;
			this.timer = setTimeout(function(){
						that.revertPages();
						//that.scrollSuccess?that.fn_afterSliding[that.pageNow-1].call(that):"";
						if(that.scrollSuccess)
						{
							_pageInfo.finalPageIndex = that.pageNow;
							that.cb_afterSliding.call(that,_pageInfo);
							that.fn_afterSliding[that.pageNow-1].call(that);
						}
						that.moved = false;
						that.isMoving = false;
						this.timer = 0;
						that.direction = "";
						that.scrollSuccess = false;
						that.needToScroll = false;
						that.revertImmediately = false;
					},this.revertImmediately? 30 : arguments.length>0 && Number(arguments[0]) ? this.duration + Math.floor(arguments[0]):this.duration);
		},
		setStaticSlideDatas : function(evt){
			this.isPc?"":(evt.clientY = evt.targetTouches[0].clientY);
			evt.preventDefault();
			this.moved = true;
			if(this.originClientY < evt.clientY  && this.pageNow >1 )
			{
				this.originClientY = evt.clientY;
				this.direction == "next"?this.needToScroll = false:this.direction = "prev";

			}
			else if(this.originClientY > evt.clientY && this.pageNow < this.pages.length)
			{
				this.originClientY = evt.clientY;
				this.direction == "prev"?this.needToScroll = false:this.direction = "next";
			}
			else{
				this.moved = false;
				this.needToScroll = false;
				this.direction = "";
			}
		},
		scrollByDirection : function(){
			if(this.direction == "prev")
			{
				this.toPrevPage();
			}
			else if(this.direction == "next")
			{
				this.toNextPage();
			}
		},
		isScrollable : function(evt){
			this.isPc?"":(evt.clientY = evt.targetTouches[0].clientY);
			function detectScrollable(){
				if(this.originClientY < evt.clientY && !this.allowToPrev)
				{
					//direction prev
					return false;
				}
				if(this.originClientY > evt.clientY && !this.allowToNext)
				{
					//direction next
					return false;
				}
				return true;
			}
			if(this.slideMode == "static")
			{
				if(!detectScrollable.call(this))
				{
					this.needToScroll = false;
					this.revertImmediately = true;
				}
				this.setStaticSlideDatas(evt);
				return false;
			}
			else
			{
				if(!detectScrollable.call(this))
				{
					this.revertImmediately = true;
					this.pageNow > 1 ? setTranCss(this.pages[this.pageNow-2],-cH):"";
					setTranCss(this.pages[this.pageNow-1],0);
					this.pageNow < this.pages.length? setTranCss(this.pages[this.pageNow],cH):"";
					return false;
				}
			}
			this.revertImmediately = false;
			return true;
		},
		onlyTouchToNext : function(){
			this.allowToNext = true;
			this.allowToPrev = false;
		},
		onlyTouchToPrev : function(){
			this.allowToNext = false;
			this.allowToPrev = true;
		},
		denyTouchToBoth : function(){
			this.allowToNext = false;
			this.allowToPrev = false;
		},
		allowTouchToBoth : function(){
			this.allowToNext = true;
			this.allowToPrev = true;
		}
	}

	aScrollPage.prototype._init.prototype = aScrollPage.prototype;

	/**
	 * [setTranCssDefind description]
	 * @param {[type]} offsetY    [description]
	 * @param {[type]} transition [description]
	 */
	function setTranCssDefind()
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

	function setTranCss()
	{
		setTranCssDefind.apply(arguments[0],Array.prototype.slice.call(arguments).slice(1));
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

	window.aScrollPage = aScrollPage;
})(window,undefined)