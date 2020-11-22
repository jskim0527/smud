/**
 * 작업용 스크립트
 */

/**
 * Override the initialize function for the _historyInit();
 */
fabric.Canvas.prototype.initialize = (function(originalFn) {
  return function(...args) {
    originalFn.call(this, ...args);
    this._smudInit();
    return this;
  };
})(fabric.Canvas.prototype.initialize);

/**
 * Override the dispose function for the _historyDispose();
 */
fabric.Canvas.prototype.dispose = (function(originalFn) {
  return function(...args) {
    originalFn.call(this, ...args);
    this._smudDispose();
    return this;
  };
})(fabric.Canvas.prototype.dispose);

/**
 * Returns an object with fabricjs event mappings
 */
fabric.Canvas.prototype._smudEvents = function() {
  return {
    'object:added': this._smudMonitoring,
    'object:removed': this._smudMonitoring,
    'object:modified': this._smudMonitoring,
    'object:skewing': this._smudMonitoring
  }
}

/**
 * Initialization of the plugin
 */
fabric.Canvas.prototype._smudInit = function() {
  // this.historyUndo = [];
  // this.historyRedo = [];
  // this.extraProps = ['selectable'];
  // this.historyNextState = this._historyNext();
  console.log("_smudInit");
  this.on(this._smudEvents());
}

/**
 * Remove the custom event listeners
 */
fabric.Canvas.prototype._smudDispose = function() {
  console.log("_smudDispose");
  this.off(this._smudEvents())
}

/**
 * It pushes the state of the canvas into history stack
 */
fabric.Canvas.prototype._smudMonitoring = function() {
  //console.log("monitoring");
}

fabric.Canvas.prototype.initGrid = function(iWidth, iHeight) {
  var iGap = 50;

  for (var i = 0; i < (iHeight / iGap); i++) {
    this.add(new fabric.Line([i * iGap, 0, i * iGap, iHeight], {
      stroke: '#d6d6d6',
      selectable: false
    }));
    this.add(new fabric.Line([0, i * iGap, iWidth, i * iGap], {
      stroke: '#d6d6d6',
      selectable: false
    }))
  }

  this.on({
    'selection:created': function() {
      console.log(this.getActiveObject().type);
    },
    'selection:updated': function() {
      console.log(this.getActiveObject().type);
    },
    'selection:cleared': function() {
      console.log(this.getActiveObject().type);
    },
    'object:moving': function(opt) {
      if (Math.round(opt.target.left / iGap * 4) % 4 == 0 &&
      Math.round(opt.target.top / iGap * 4) % 4 == 0) {
        opt.target.set({
        left: Math.round(opt.target.left / iGap) * iGap,
        top: Math.round(opt.target.top / iGap) * iGap
      }).setCoords();
      }  
    },
    'mouse:down': function(opt) {
      var evt = opt.e;
      if (evt.altKey === true) {
        this.isDragging = true;
        this.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
      }
    },
    'mouse:move': function(opt) {
      if (this.isDragging) {
        var e = opt.e;
        var vpt = this.viewportTransform;
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        this.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
      }
    },
    'mouse:up': function(opt) {
      // on mouse up we want to recalculate new interaction
      // for all objects, so we call setViewportTransform
      this.setViewportTransform(this.viewportTransform);
      this.isDragging = false;
      this.selection = true;
    },
    'mouse:wheel': function(opt) {
      var delta = opt.e.deltaY;
      var zoom = this.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      this.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    },
    'touch:longpress': function() {
      alert();
    }
  });
}       

/**
 * 이미지 붙여 넣기
 * @param {*} o 
 * @param {*} e 
 */
fabric.Canvas.prototype.PasteImage = function(o, e) {
  var items = e.originalEvent.clipboardData.items;
  
  e.preventDefault();
  e.stopPropagation();
  
  //Loop through files
  for (var i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') == -1) continue;
    var file = items[i],
      type = items[i].type;
    var imageData = file.getAsFile();
    var URLobj = window.URL || window.webkitURL;
    var img = new Image();
    img.src = URLobj.createObjectURL(imageData);

    console.log(img.src);
    fabric.Image.fromURL(img.src, function(img) {
      o.add(img);
      console.log("이미지 붙여넣기");
    });
  }
}

/**
 * 잘라내기
 */
fabric.Canvas.prototype.Cut = function() {
  this.Copy();
  this.Delete();
}

/**
 * 복사
 */
fabric.Canvas.prototype.Copy = function() {
	this.getActiveObject().clone(function(cloned) {
		_clipboard = cloned;
  });
}

/**
 * 붙여넣기
 * TODO 파라메터 => this
 * @param {*} o 
 */
fabric.Canvas.prototype.Paste = function(o) {
	_clipboard.clone(function(clonedObj) {
		o.discardActiveObject();
		clonedObj.set({
			left: clonedObj.left + 10,
			top: clonedObj.top + 10,
			evented: true,
		});
		if (clonedObj.type === 'activeSelection') {
			// active selection needs a reference to the canvas.
			clonedObj.canvas = o;
			clonedObj.forEachObject(function(obj) {
				o.add(obj);
			});
			// this should solve the unselectability
			clonedObj.setCoords();
		} else {
			o.add(clonedObj);
		}
		_clipboard.top += 10;
		_clipboard.left += 10;
		o.setActiveObject(clonedObj);
		o.requestRenderAll();
	});
}

/**
 * 삭제
 */
fabric.Canvas.prototype.Delete = function() {
  this.remove(this.getActiveObject());
}

/**
 * Canvas에 TextBox 추가
 * @param {*} e 
 */
fabric.Canvas.prototype.AddTextBox = function(e) {
  var rect = new fabric.Textbox('This is TextBox', {
    left: 100,
    top: 50,
    width: 200,
    height: 100,
    fontSize: 20,
    objectCaching: false,
    fontFamily: 'Noto Sans KR'
    //hasControls: false,
  });

  this.add(rect);
  this.setActiveObject(rect);
}

/**
 * Canvas에 ColorBox 추가
 * @param {*} e 
 */
fabric.Canvas.prototype.AddColorBox = function(e) {
  var rect = new fabric.Rect({
    left: 100,
    top: 50,
    fill: STR_RGB,
    width: 200,
    height: 100,
    objectCaching: false,
    //stroke: 'lightgreen',
    //strokeWidth: 4,
  });

  this.add(rect);
  this.setActiveObject(rect);
}