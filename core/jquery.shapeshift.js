;(function ($, window, document, undefined) { // eslint-disable-line
  const pluginName = 'shapeshift';
  const defaults = {
    gutter: [20, 10]
  };

  function Plugin(element, options) {
    this.options = $.extend({}, defaults, options);
    this._name = pluginName;
    this._defaults = defaults;

    this.$element = $(element);
    this.element = element;

    this.init();
  }

  Plugin.prototype = {
    init() {
      this._setupGlobals();
      this._parseChildren();
      this._setupResizeListener();

      this._updateContainerWidth();

      return this;
    },

    /**
     * Creates the initial listener on the window for the resize event.
     *
     * @method _setupResizeListener
     */
    _setupResizeListener() {
      $(window).on('resize', this._updateContainerWidth.bind(this));
    },

    /**
     * Sets global variables to their proper initial states.
     *
     * @method _setupGlobals
     */
    _setupGlobals() {
      this._setIdentifier();

      this.children = [];
      this.colHeights = [];
      this.gutterX = this.options.gutter[0];
      this.gutterY = this.options.gutter[1];

      this._setColumnWidth();
    },

    /**
     * Cache the width of the container so that we do not have to keep
     * looking it up.
     *
     * @method _updateContainerWidth
     */
    _updateContainerWidth() {
      const container_width = this.$element.width();

      if (container_width !== this.containerWidth) {
        this.containerWidth = container_width;

        this._containerWidthChanged();
      }
    },

    /**
     * Whenever the container width has changed, we should run some logic
     * to see if more updates have to be made.
     *
     * @method _containerWidthChanged
     */
    _containerWidthChanged() {
      const column_count = this._getColumnCount();

      if (column_count !== this.colCount) {
        this.colCount = column_count;
        this._columnCountChanged();
      }
    },

    /**
     * Whenever the amount of columns have changed, we need to run some
     * logic which occurs whenever columns have been added or lost.
     *
     * @method _columnCountChanged
     */
    _columnCountChanged() {
      this._resetColHeights();
      this.update();
    },

    /**
     * The column width can be set via the options object when instantiating
     * the plugin, or it can be dynamically set by finding the width of a
     * single span element on load.
     *
     * @method _setColumnWidth
     */
    _setColumnWidth() {
      const $first_child = this.$element.children().first();
      this.colWidth = $first_child.width();
    },

    /**
     * Resets the children collection and adds all the currently existing
     * children to the collection.
     *
     * @method parseChildren
     * @access private
     */
    _parseChildren() {
      this.children = [];

      const $children = this.$element.children();
      $children.each((n, el) =>
        this._addNewChild(el, n)
      ).bind(this);
    },

    /**
     * Creates a unique identifier for this instantiation so that they
     * can be referenced individually.
     *
     * @method _setIdentifier
     */
    _setIdentifier() {
      this.identifier = `ss-${Math.random().toString(36).substring(7)}`;
    },

    /**
     * Adds a child that doesn't currently exist into the collection.
     *
     * @method addNewChild
     * @param el      {Element}   The DOM node for that child
     * @param index   {Integer}   The spot where the child will exist
     * @access private
     */
    _addNewChild(el, index) {
      const $el = $(el);

      this.children.push({
        el,
        $el,
        index,
        height: $el.height(),
        x: 0,
        y: 0
      });
    },

    /**
     * Update gets run every time we need to have the elements shifted.
     *
     * @method update
     */
    update() {
      this._pack();
      this.render();
    },

    /**
     * The colHeights variable stores an array of the heights for every
     * existing column. This refreshes that array, which requires some
     * pre formatting of data.
     *
     * @method _resetColHeights
     */
    _resetColHeights() {
      const colHeights = [];
      const columns = this._getColumnCount();

      for (let i = 0; i < columns; i++) {
        colHeights[i] = 0;
      }

      this.colHeights = colHeights;
      this.colCount = colHeights.length;
    },

    /**
     * Calculates how many columns could fit into the current
     *
     * @method _getColumnCount
     */
    _getColumnCount() {
      let available_width = this.containerWidth;

      // Add one gutter width to the container width so that we can
      // correctly calculate how many columns can be present when also
      // considering that there are gutters.
      available_width += this.gutterX;
      const adjusted_col_width = this.colWidth + this.gutterX;

      return Math.floor(available_width / adjusted_col_width);
    },

    /**
     * The pack function is what helps calculate the positioning for all
     * of the child elements.
     *
     * @method _pack
     */
    _pack() {
      this.children.forEach(this._packChild.bind(this));
    },

    /**
     * Calculates and assigns the position of a child object.
     *
     * @method _packChild
     */
    _packChild(child) {
      const column = this._fitMinIndex(this.colHeights);
      const padding_offset = column * this.gutterX;

      child.y = this.colHeights[column];
      child.x = (column * child.$el.width()) + padding_offset;

      this.colHeights[column] += child.height + this.gutterY;
    },

    /**
     * When given an array, determines which array position is the lowest
     * value.
     *
     * @param array   {Array}   The array of values to compare against
     */
    _fitMinIndex(array) {
      return array.indexOf(Math.min.apply(null, array));
    },

    /**
     * Render is what physically moves the elements into their current
     * positions.
     *
     * @method render
     */
    render() {
      this.children.forEach(this._positionChild.bind(this));
    },

    /**
     * Takes a child object and moves it to the correct position.
     *
     * @method _positionChild
     * @param child   {Object}   The child object
     */
    _positionChild(child) {
      child.$el.css({
        transform: `translate3d(${child.x}px, ${child.y}px,0)`
      });
    },

    /**
     * Destroy garbage cleans.
     *
     * @method destroy
     */
    destroy() {
      console.log('Clean up, clean up. Everybody, everywhere.');
    }
  };

  $.fn[pluginName] = function(options) {
    const scoped_name = `plugin_${pluginName}`;

    // Shapeshift instantiation
    // $.shapeshift() or $.shapeshift({ option: thing })
    if (options === undefined || typeof options === 'object') {
      return this.each(() => {
        if (!$.data(this, scoped_name)) {
          $.data(this, scoped_name, new Plugin(this, options));
        }
      });
    }

    const is_public_function = typeof options === 'string' &&
            options[0] !== '_' &&
            options !== 'init';

    if (!is_public_function) {
      return this;
    }

    // Call public functions on already-created instances.
    this.each(() => {
      const instance = $.data(this, scoped_name);
      const is_function = instance instanceof Plugin &&
              typeof instance[options] === 'function';

      if (is_function) {
        instance[options].apply(instance, Array.prototype.slice.call(arguments, 1));
      }

      if (options === 'destroy') {
        return $.data(this, scoped_name, null);
      }

      return this;
    });

    return this;
  };
})(jQuery, window, document);
