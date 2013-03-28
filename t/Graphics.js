/* nodeView::t/Graphics.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

NodeView.Graphics.Rectangle.tests({
    coldet_01: function () {
        var rect = NodeView.Rectangle(100, 200);
        rect.x(0).y(0);
        this.ok(rect.coldet(0, 0));
        this.ok(rect.coldet(100, 0));
        this.ok(rect.coldet(0, 200));
        this.ok(rect.coldet(100, 200));
        this.ok(rect.coldet(50, 100));
        this.ok(!rect.coldet(200, 300));
    }
});
NodeView.Graphics.Circle.tests({
    coldet_01: function () {
        var circle = NodeView.Circle(100);
        circle.x(0).y(0);
        this.ok(circle.coldet(0, 0));
        this.ok(circle.coldet(50, 50));
        this.ok(circle.coldet(0, 100));
        this.ok(circle.coldet(100, 0));
        this.ok(circle.coldet(0, -100));
        this.ok(circle.coldet(-100, 0));
        this.ok(!circle.coldet(100, 100));
        this.ok(!circle.coldet(100, -100));
        this.ok(!circle.coldet(-100, 100));
        this.ok(!circle.coldet(-100, -100));
        this.ok(!circle.coldet(0, 101));
        this.ok(!circle.coldet(101, 0));
    }
});
