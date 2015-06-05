// danger but convenient, do NOT use them in real projects
extend(HTMLElement.prototype, {
  'hasClass': function (input) {
    return list(input).every(function (item) {
      return !item || this.classList.contains(item);
    }, this);
  },

  'hasAnyClass': function (input) {
    return list(input).some(function (item) {
      return item && this.classList.contains(item);
    }, this);
  }
});

['add', 'remove', 'toggle'].map(function (action) {
  HTMLElement.prototype[action + 'Class'] = function (input) {
    list(input).forEach(function (item) {
      item && this.classList[action](item);
    }, this);
    return this;
  };
});
