(this.webpackJsonpclient=this.webpackJsonpclient||[]).push([[0],{33:function(e,t,n){e.exports=n(55)},38:function(e,t,n){},39:function(e,t,n){},47:function(e,t){},48:function(e,t){},49:function(e,t){},55:function(e,t,n){"use strict";n.r(t);var a=n(2),c=n.n(a),r=n(30),o=n.n(r),i=(n(38),n(10)),u=n(11),l=n(13),s=n(12),m=n(14),d=(n(39),n(18)),h=n.n(d),p=n(23),f=n(15),v=(n(22),function(e){function t(e){return Object(i.a)(this,t),Object(l.a)(this,Object(s.a)(t).call(this,e))}return Object(m.a)(t,e),Object(u.a)(t,[{key:"componentDidMount",value:function(){var e=Object(p.a)(h.a.mark((function e(){var t;return h.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:console.log(f.d),t=document.getElementById("camera"),document.getElementById("result"),navigator.mediaDevices.getUserMedia({video:!0}).then((function(e){return t.srcObject=e,new Promise((function(e){return t.onloadedmetadata=e}))})).catch((function(e){return console.log(e)}));case 4:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}()},{key:"onPlay",value:function(){var e=Object(p.a)(h.a.mark((function e(){var t,n;return h.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return console.log("Media streamed!"),e.next=3,f.b("/models");case 3:return e.next=5,f.c("/models");case 5:return t=document.getElementById("camera"),e.next=8,f.a(t).withFaceExpressions();case 8:n=e.sent,console.log(n);case 10:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}()},{key:"render",value:function(){return c.a.createElement("div",null,c.a.createElement("h1",null,"This is the app!"),c.a.createElement("video",{onLoadedMetadata:this.onPlay,autoPlay:!0,id:"camera"}),c.a.createElement("canvas",{id:"result"}))}}]),t}(c.a.Component)),b=n(16),E=function(e){function t(){return Object(i.a)(this,t),Object(l.a)(this,Object(s.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(u.a)(t,[{key:"render",value:function(){return c.a.createElement("div",null,c.a.createElement(b.b,{to:"./launch"},"Start Application"))}}]),t}(c.a.Component),j=n(7),O=function(e){function t(){return Object(i.a)(this,t),Object(l.a)(this,Object(s.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(u.a)(t,[{key:"render",value:function(){return c.a.createElement(j.c,null,c.a.createElement((function(){return c.a.createElement("div",null,c.a.createElement(j.c,null,c.a.createElement(j.a,{exact:!0,path:"/",component:E}),c.a.createElement(j.a,{path:"/launch",component:v})))}),null))}}]),t}(c.a.Component);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));o.a.render(c.a.createElement(b.a,null,c.a.createElement(O,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()}))}},[[33,1,2]]]);
//# sourceMappingURL=main.6774d6c8.chunk.js.map