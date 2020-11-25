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

fabric.Canvas.prototype.initCanvas = function() {
  var iGap = 50;

   this.setBackgroundColor(
     'rgba(255, 255, 255, 0.6)'
   , this.renderAll.bind(this));

  this.on({
    'selection:created': function() {
      // console.log("created");
    },
    'selection:updated': function() {
      // console.log("updated");
    },
    'selection:cleared': function() {
      // console.log("cleared");
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
      if (this.isSpaceBarKeyDn) {
        //if (evt.which === 32) { // 스페이스바
        this.isDragging = true;
        this.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
      }
    },
    'mouse:move': function(opt) {
      if (this.isDragging && this.isSpaceBarKeyDn) {
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

fabric.Canvas.prototype.SpaceBarKeyDn = function(e) {
  this.isSpaceBarKeyDn = true;
  this.setCursor('pointer');
}

fabric.Canvas.prototype.SpaceBarKeyUp = function(e) {
  this.isSpaceBarKeyDn = false;
}

/**
 * 이미지 붙여 넣기
 * @param {*} e 
 */
fabric.Canvas.prototype.PasteImage = function(e) {
  var items = e.originalEvent.clipboardData.items;
  var o = this;

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
    fabric.Image.fromURL(img.src, function(img) {
      // this === window
      o.add(img);
      //console.log("이미지 붙여넣기");
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
 */
fabric.Canvas.prototype.Paste = function() {
  var o = this;
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
  var activeObject = this.getActiveObjects();
  // if (confirm('Are you sure?')) {
    this.discardActiveObject();
    this.remove(...activeObject);
  // }
}

/**
 * Canvas에 TextBox 추가
 * @param {*} e 
 */
fabric.Canvas.prototype.AddTextBox = function(e) {
  var rect = new fabric.Textbox('This is TextBox', {
    left: 100,
    top: 50,
    fill: $('.panel .color').css('background-color'),
    width: 200,
    height: 100,
    fontSize: 20,
    objectCaching: false,
    cornerColor: '#D3D7DA',
    fontFamily: 'Noto Sans KR'
    //hasControls: false,
  });

  this.add(rect);
  this.setActiveObject(rect);
}

/**
 * Canvas에 Rect 추가
 * @param {*} e 
 */
fabric.Canvas.prototype.AddRect = function(e) {
  // console.log($('.panel .color').css('background-color'));
  var rect = new fabric.Rect({
    left: 100,
    top: 50,
    fill: $('.panel .color').css('background-color'),
    width: 200,
    height: 100,
    objectCaching: false,
    cornerColor: '#D3D7DA',
    //stroke: 'lightgreen',
    //strokeWidth: 4,
  });

  this.add(rect);
  this.setActiveObject(rect);
}

/**
 * Canvas에 Circle 추가
 * @param {*} e 
 */
fabric.Canvas.prototype.AddCircle = function(e) {
  // console.log($('.panel .color').css('background-color'));
  var circle = new fabric.Circle({
    radius: 50,
    left: 100,
    top: 50,
    fill: $('.panel .color').css('background-color'),
    width: 100,
    height: 100,
    objectCaching: false,
    cornerColor: '#D3D7DA',
    //stroke: 'lightgreen',
    //strokeWidth: 4,
  });

  this.add(circle);
  this.setActiveObject(circle);
}