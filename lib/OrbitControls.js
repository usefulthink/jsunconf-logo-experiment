/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

const THREE = require('three');

function OrbitConstraint(object) {
  this.object = object;

  // "target" sets the location of focus, where the object orbits around
  // and where it pans with respect to.
  this.target = new THREE.Vector3();

  // Limits to how far you can dolly in and out ( PerspectiveCamera only )
  this.minDistance = 0;
  this.maxDistance = Infinity;

  // Limits to how far you can zoom in and out ( OrthographicCamera only )
  this.minZoom = 0;
  this.maxZoom = Infinity;

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  this.minPolarAngle = 0; // radians
  this.maxPolarAngle = Math.PI; // radians

  // How far you can orbit horizontally, upper and lower limits.
  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
  this.minAzimuthAngle = -Infinity; // radians
  this.maxAzimuthAngle = Infinity; // radians

  // Set to true to enable damping (inertia)
  // If damping is enabled, you must call controls.update() in your
  // animation loop
  this.enableDamping = false;
  this.dampingFactor = 0.25;

  ////////////
  // internals

  var self = this;

  var EPS = 0.000001;

  // Current position in spherical coordinate system.
  var theta;
  var phi;

  // Pending changes
  var phiDelta = 0;
  var thetaDelta = 0;
  var scale = 1;
  var panOffset = new THREE.Vector3();
  var zoomChanged = false;

  // API

  this.getPolarAngle = function() {
    return phi;
  };
  this.getAzimuthalAngle = function() {
    return theta;
  };
  this.rotateLeft = function(angle) {
    thetaDelta -= angle;
  };
  this.rotateUp = function(angle) {
    phiDelta -= angle;
  };

  // pass in distance in world space to move left
  this.panLeft = (function() {
    var v = new THREE.Vector3();

    return function panLeft(distance) {
      var te = this.object.matrix.elements;

      // get X column of matrix
      v.set(te[0], te[1], te[2]);
      v.multiplyScalar(-distance);

      panOffset.add(v);
    };
  })();

  // pass in distance in world space to move up
  this.panUp = (function() {
    var v = new THREE.Vector3();

    return function panUp(distance) {
      var te = this.object.matrix.elements;

      // get Y column of matrix
      v.set(te[4], te[5], te[6]);
      v.multiplyScalar(distance);

      panOffset.add(v);
    };
  })();

  // pass in x,y of change desired in pixel space,
  // right and down are positive
  this.pan = function(deltaX, deltaY, screenWidth, screenHeight) {
    if (self.object instanceof THREE.PerspectiveCamera) {
      // perspective
      var position = self.object.position;
      var offset = position.clone().sub(self.target);
      var targetDistance = offset.length();

      // half of the fov is center to top of screen
      targetDistance *= Math.tan(self.object.fov / 2 * Math.PI / 180.0);

      // we actually don't use screenWidth, since perspective camera is fixed
      // to screen height
      self.panLeft(2 * deltaX * targetDistance / screenHeight);
      self.panUp(2 * deltaY * targetDistance / screenHeight);
    } else if (self.object instanceof THREE.OrthographicCamera) {
      // orthographic
      self.panLeft(
        deltaX * (self.object.right - self.object.left) / screenWidth);
      self.panUp(
        deltaY * (self.object.top - self.object.bottom) / screenHeight);
    } else {
      // camera neither orthographic or perspective
      console.warn(
        'WARNING: OrbitControls.js encountered an unknown camera ' +
        'type - pan disabled.');
    }
  };

  this.dollyIn = function(dollyScale) {
    if (self.object instanceof THREE.PerspectiveCamera) {
      scale /= dollyScale;
    } else if (self.object instanceof THREE.OrthographicCamera) {
      self.object.zoom = Math.max(this.minZoom,
        Math.min(this.maxZoom, this.object.zoom * dollyScale));
      self.object.updateProjectionMatrix();
      zoomChanged = true;
    } else {
      console.warn(
        'WARNING: OrbitControls.js encountered an unknown camera type - ' +
        'dolly/zoom disabled.');
    }
  };

  this.dollyOut = function(dollyScale) {
    if (self.object instanceof THREE.PerspectiveCamera) {
      scale *= dollyScale;
    } else if (self.object instanceof THREE.OrthographicCamera) {
      self.object.zoom = Math.max(this.minZoom,
        Math.min(this.maxZoom, this.object.zoom / dollyScale));
      self.object.updateProjectionMatrix();
      zoomChanged = true;
    } else {
      console.warn(
        'WARNING: OrbitControls.js encountered an unknown camera type - ' +
        'dolly/zoom disabled.');
    }
  };

  this.update = (function() {
    var offset = new THREE.Vector3();

    // so camera.up is the orbit axis
    var quat = new THREE.Quaternion().setFromUnitVectors(object.up,
      new THREE.Vector3(0, 1, 0));
    var quatInverse = quat.clone().inverse();

    var lastPosition = new THREE.Vector3();
    var lastQuaternion = new THREE.Quaternion();

    return function() {
      var position = this.object.position;

      offset.copy(position).sub(this.target);

      // rotate offset to "y-axis-is-up" space
      offset.applyQuaternion(quat);

      // angle from z-axis around y-axis

      theta = Math.atan2(offset.x, offset.z);

      // angle from y-axis

      phi = Math.atan2(
        Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);

      theta += thetaDelta;
      phi += phiDelta;

      // restrict theta to be between desired limits
      theta = Math.max(this.minAzimuthAngle,
        Math.min(this.maxAzimuthAngle, theta));

      // restrict phi to be between desired limits
      phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));

      // restrict phi to be betwee EPS and PI-EPS
      phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

      var radius = offset.length() * scale;

      // restrict radius to be between desired limits
      radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

      // move target to panned location
      this.target.add(panOffset);

      offset.x = radius * Math.sin(phi) * Math.sin(theta);
      offset.y = radius * Math.cos(phi);
      offset.z = radius * Math.sin(phi) * Math.cos(theta);

      // rotate offset back to "camera-up-vector-is-up" space
      offset.applyQuaternion(quatInverse);

      position.copy(this.target).add(offset);

      this.object.lookAt(this.target);

      if (this.enableDamping === true) {
        thetaDelta *= 1 - this.dampingFactor;
        phiDelta *= 1 - this.dampingFactor;
      } else {
        thetaDelta = 0;
        phiDelta = 0;
      }

      scale = 1;
      panOffset.set(0, 0, 0);

      // update condition is:
      // min(camera displacement, camera rotation in radians)^2 > EPS
      // using small-angle approximation cos(x/2) = 1 - x^2 / 8

      if (zoomChanged ||
          lastPosition.distanceToSquared(this.object.position) > EPS ||
          8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS) {
        lastPosition.copy(this.object.position);
        lastQuaternion.copy(this.object.quaternion);
        zoomChanged = false;

        return true;
      }

      return false;
    };
  })();
}


// This set of controls performs orbiting, dollying (zooming), and panning.
// It maintains the "up" direction as +Y, unlike the TrackballControls.
// Touch on tablet and phones is supported.
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe

THREE.OrbitControls = function(object, domElement) {
  var constraint = new OrbitConstraint(object);

  this.domElement = (domElement !== undefined) ? domElement : document;

  // API
  Object.defineProperty(this, 'constraint', {
    get() {
      return constraint;
    }
  });

  this.getPolarAngle = function() {
    return constraint.getPolarAngle();
  };

  this.getAzimuthalAngle = function() {
    return constraint.getAzimuthalAngle();
  };

  // Set to false to disable this control
  this.enabled = true;

  // center is old, deprecated; use "target" instead
  this.center = this.target;

  // This option actually enables dollying in and out; left as "zoom" for
  // backwards compatibility.
  // Set to false to disable zooming
  this.enableZoom = true;
  this.zoomSpeed = 1.0;

  // Set to false to disable rotating
  this.enableRotate = true;
  this.rotateSpeed = 1.0;

  // Set to false to disable panning
  this.enablePan = true;
  this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

  // Set to true to automatically rotate around the target
  // If auto-rotate is enabled, you must call controls.update() in your
  // animation loop
  this.autoRotate = false;
  this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

  // Set to false to disable use of the keys
  this.enableKeys = true;

  // The four arrow keys
  this.keys = {LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40};

  // Mouse buttons
  this.mouseButtons = {
    ORBIT: THREE.MOUSE.LEFT,
    ZOOM: THREE.MOUSE.MIDDLE,
    PAN: THREE.MOUSE.RIGHT
  };

  ////////////
  // internals

  var self = this;

  var rotateStart = new THREE.Vector2();
  var rotateEnd = new THREE.Vector2();
  var rotateDelta = new THREE.Vector2();

  var panStart = new THREE.Vector2();
  var panEnd = new THREE.Vector2();
  var panDelta = new THREE.Vector2();

  var dollyStart = new THREE.Vector2();
  var dollyEnd = new THREE.Vector2();
  var dollyDelta = new THREE.Vector2();

  var STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_DOLLY: 4,
    TOUCH_PAN: 5
  };

  var state = STATE.NONE;

  // for reset

  this.target0 = this.target.clone();
  this.position0 = this.object.position.clone();
  this.zoom0 = this.object.zoom;

  // events

  var changeEvent = {type: 'change'};
  var startEvent = {type: 'start'};
  var endEvent = {type: 'end'};

  // pass in x,y of change desired in pixel space,
  // right and down are positive
  function pan(deltaX, deltaY) {
    var element = self.domElement === document ?
      self.domElement.body : self.domElement;

    constraint.pan(deltaX, deltaY, element.clientWidth, element.clientHeight);
  }

  this.update = function() {
    if (this.autoRotate && state === STATE.NONE) {
      constraint.rotateLeft(getAutoRotationAngle());
    }

    if (constraint.update() === true) {
      this.dispatchEvent(changeEvent);
    }
  };

  this.reset = function() {
    state = STATE.NONE;

    this.target.copy(this.target0);
    this.object.position.copy(this.position0);
    this.object.zoom = this.zoom0;

    this.object.updateProjectionMatrix();
    this.dispatchEvent(changeEvent);

    this.update();
  };

  function getAutoRotationAngle() {
    return 2 * Math.PI / 60 / 60 * self.autoRotateSpeed;
  }

  function getZoomScale() {
    return Math.pow(0.95, self.zoomSpeed);
  }

  function onMouseDown(event) {
    if (self.enabled === false) {
      return;
    }

    event.preventDefault();

    if (event.button === self.mouseButtons.ORBIT) {
      if (self.enableRotate === false) {
        return;
      }

      state = STATE.ROTATE;

      rotateStart.set(event.clientX, event.clientY);
    } else if (event.button === self.mouseButtons.ZOOM) {
      if (self.enableZoom === false) {
        return;
      }

      state = STATE.DOLLY;

      dollyStart.set(event.clientX, event.clientY);
    } else if (event.button === self.mouseButtons.PAN) {
      if (self.enablePan === false) {
        return;
      }

      state = STATE.PAN;

      panStart.set(event.clientX, event.clientY);
    }

    if (state !== STATE.NONE) {
      document.addEventListener('mousemove', onMouseMove, false);
      document.addEventListener('mouseup', onMouseUp, false);
      self.dispatchEvent(startEvent);
    }
  }

  function onMouseMove(event) {
    if (self.enabled === false) {
      return;
    }

    event.preventDefault();

    var element = self.domElement === document ?
      self.domElement.body : self.domElement;

    if (state === STATE.ROTATE) {
      if (self.enableRotate === false) {
        return;
      }

      rotateEnd.set(event.clientX, event.clientY);
      rotateDelta.subVectors(rotateEnd, rotateStart);

      // rotating across whole screen goes 360 degrees around
      constraint.rotateLeft(2 * Math.PI * rotateDelta.x /
        element.clientWidth * self.rotateSpeed);

      // rotating up and down along whole screen attempts to go 360,
      // but limited to 180
      constraint.rotateUp(2 * Math.PI * rotateDelta.y /
        element.clientHeight * self.rotateSpeed);

      rotateStart.copy(rotateEnd);
    } else if (state === STATE.DOLLY) {
      if (self.enableZoom === false) {
        return;
      }

      dollyEnd.set(event.clientX, event.clientY);
      dollyDelta.subVectors(dollyEnd, dollyStart);

      if (dollyDelta.y > 0) {
        constraint.dollyIn(getZoomScale());
      } else if (dollyDelta.y < 0) {
        constraint.dollyOut(getZoomScale());
      }

      dollyStart.copy(dollyEnd);
    } else if (state === STATE.PAN) {
      if (self.enablePan === false) {
        return;
      }

      panEnd.set(event.clientX, event.clientY);
      panDelta.subVectors(panEnd, panStart);

      pan(panDelta.x, panDelta.y);

      panStart.copy(panEnd);
    }

    if (state !== STATE.NONE) {
      self.update();
    }
  }

  function onMouseUp(/* event */) {
    if (self.enabled === false) {
      return;
    }

    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);
    self.dispatchEvent(endEvent);
    state = STATE.NONE;
  }

  function onMouseWheel(event) {
    if (self.enabled === false || self.enableZoom === false ||
      state !== STATE.NONE) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    var delta = 0;

    if (event.wheelDelta !== undefined) {
      // WebKit / Opera / Explorer 9
      delta = event.wheelDelta;
    } else if (event.detail !== undefined) {
      // Firefox
      delta = -event.detail;
    }

    if (delta > 0) {
      constraint.dollyOut(getZoomScale());
    } else if (delta < 0) {
      constraint.dollyIn(getZoomScale());
    }

    self.update();
    self.dispatchEvent(startEvent);
    self.dispatchEvent(endEvent);
  }

  function onKeyDown(event) {
    if (self.enabled === false || self.enableKeys === false ||
      self.enablePan === false) {
      return;
    }

    switch (event.keyCode) {
    case self.keys.UP:
      pan(0, self.keyPanSpeed);
      self.update();
      break;

    case self.keys.BOTTOM:
      pan(0, -self.keyPanSpeed);
      self.update();
      break;

    case self.keys.LEFT:
      pan(self.keyPanSpeed, 0);
      self.update();
      break;

    case self.keys.RIGHT:
      pan(-self.keyPanSpeed, 0);
      self.update();
      break;
    }
  }

  function touchstart(event) {
    if (self.enabled === false) {
      return;
    }

    switch (event.touches.length) {
    case 1:	// one-fingered touch: rotate
      if (self.enableRotate === false) {
        return;
      }

      state = STATE.TOUCH_ROTATE;

      rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
      break;

    case 2:	// two-fingered touch: dolly
      if (self.enableZoom === false) {
        return;
      }

      state = STATE.TOUCH_DOLLY;

      var dx = event.touches[0].pageX - event.touches[1].pageX;
      var dy = event.touches[0].pageY - event.touches[1].pageY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      dollyStart.set(0, distance);
      break;

    case 3: // three-fingered touch: pan
      if (self.enablePan === false) {
        return;
      }

      state = STATE.TOUCH_PAN;

      panStart.set(event.touches[0].pageX, event.touches[0].pageY);
      break;

    default:
      state = STATE.NONE;
    }

    if (state !== STATE.NONE) {
      self.dispatchEvent(startEvent);
    }
  }

  function touchmove(event) {
    if (self.enabled === false) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    var element = self.domElement === document ?
      self.domElement.body : self.domElement;

    switch (event.touches.length) {
    case 1: // one-fingered touch: rotate
      if (self.enableRotate === false) {
        return;
      }
      if (state !== STATE.TOUCH_ROTATE) {
        return;
      }

      rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
      rotateDelta.subVectors(rotateEnd, rotateStart);

        // rotating across whole screen goes 360 degrees around
      constraint.rotateLeft(2 * Math.PI * rotateDelta.x /
          element.clientWidth * self.rotateSpeed);
        // rotating up and down along whole screen attempts to go 360,
        // but limited to 180
      constraint.rotateUp(2 * Math.PI * rotateDelta.y /
          element.clientHeight * self.rotateSpeed);

      rotateStart.copy(rotateEnd);

      self.update();
      break;

    case 2: // two-fingered touch: dolly
      if (self.enableZoom === false) {
        return;
      }
      if (state !== STATE.TOUCH_DOLLY) {
        return;
      }

      var dx = event.touches[0].pageX - event.touches[1].pageX;
      var dy = event.touches[0].pageY - event.touches[1].pageY;
      var distance = Math.sqrt(dx * dx + dy * dy);

      dollyEnd.set(0, distance);
      dollyDelta.subVectors(dollyEnd, dollyStart);

      if (dollyDelta.y > 0) {
        constraint.dollyOut(getZoomScale());
      } else if (dollyDelta.y < 0) {
        constraint.dollyIn(getZoomScale());
      }

      dollyStart.copy(dollyEnd);

      self.update();
      break;

    case 3: // three-fingered touch: pan
      if (self.enablePan === false) {
        return;
      }
      if (state !== STATE.TOUCH_PAN) {
        return;
      }

      panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
      panDelta.subVectors(panEnd, panStart);

      pan(panDelta.x, panDelta.y);

      panStart.copy(panEnd);

      self.update();
      break;

    default:
      state = STATE.NONE;
    }
  }

  function touchend(/* event */) {
    if (self.enabled === false) {
      return;
    }

    self.dispatchEvent(endEvent);
    state = STATE.NONE;
  }

  function contextmenu(event) {
    event.preventDefault();
  }

  this.dispose = function() {
    this.domElement.removeEventListener('contextmenu', contextmenu, false);
    this.domElement.removeEventListener('mousedown', onMouseDown, false);
    this.domElement.removeEventListener('mousewheel', onMouseWheel, false);
    this.domElement.removeEventListener(
      'MozMousePixelScroll', onMouseWheel, false); // firefox

    this.domElement.removeEventListener('touchstart', touchstart, false);
    this.domElement.removeEventListener('touchend', touchend, false);
    this.domElement.removeEventListener('touchmove', touchmove, false);

    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);

    window.removeEventListener('keydown', onKeyDown, false);
  };

  this.domElement.addEventListener('contextmenu', contextmenu, false);

  this.domElement.addEventListener('mousedown', onMouseDown, false);
  this.domElement.addEventListener('mousewheel', onMouseWheel, false);
  this.domElement.addEventListener(
    'MozMousePixelScroll', onMouseWheel, false); // firefox

  this.domElement.addEventListener('touchstart', touchstart, false);
  this.domElement.addEventListener('touchend', touchend, false);
  this.domElement.addEventListener('touchmove', touchmove, false);

  window.addEventListener('keydown', onKeyDown, false);

  // force an update at start
  this.update();
};

THREE.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

Object.defineProperties(THREE.OrbitControls.prototype, {
  object: {
    get() {
      return this.constraint.object;
    }
  },

  target: {
    get() {
      return this.constraint.target;
    },

    set(value) {
      console.warn(
        'THREE.OrbitControls: target is now immutable. ' +
        'Use target.set() instead.');
      this.constraint.target.copy(value);
    }
  },

  minDistance: {
    get() {
      return this.constraint.minDistance;
    },

    set(value) {
      this.constraint.minDistance = value;
    }
  },

  maxDistance: {
    get() {
      return this.constraint.maxDistance;
    },

    set(value) {
      this.constraint.maxDistance = value;
    }
  },

  minZoom: {
    get() {
      return this.constraint.minZoom;
    },

    set(value) {
      this.constraint.minZoom = value;
    }
  },

  maxZoom: {
    get() {
      return this.constraint.maxZoom;
    },

    set(value) {
      this.constraint.maxZoom = value;
    }
  },

  minPolarAngle: {
    get() {
      return this.constraint.minPolarAngle;
    },

    set(value) {
      this.constraint.minPolarAngle = value;
    }
  },

  maxPolarAngle: {
    get() {
      return this.constraint.maxPolarAngle;
    },

    set(value) {
      this.constraint.maxPolarAngle = value;
    }
  },

  minAzimuthAngle: {
    get() {
      return this.constraint.minAzimuthAngle;
    },

    set(value) {
      this.constraint.minAzimuthAngle = value;
    }
  },

  maxAzimuthAngle: {
    get() {
      return this.constraint.maxAzimuthAngle;
    },
    set(value) {
      this.constraint.maxAzimuthAngle = value;
    }
  },

  enableDamping: {
    get() {
      return this.constraint.enableDamping;
    },

    set(value) {
      this.constraint.enableDamping = value;
    }
  },

  dampingFactor: {
    get() {
      return this.constraint.dampingFactor;
    },

    set(value) {
      this.constraint.dampingFactor = value;
    }
  }
});

module.exports = THREE.OrbitControls;
