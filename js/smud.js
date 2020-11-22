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
    'object:moving': function(options) {
      if (Math.round(options.target.left / iGap * 4) % 4 == 0 &&
      Math.round(options.target.top / iGap * 4) % 4 == 0) {
      options.target.set({
        left: Math.round(options.target.left / iGap) * iGap,
        top: Math.round(options.target.top / iGap) * iGap
      }).setCoords();
      }  
    },
    'touch:longpress': function() {
      alert();
    }
  });
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