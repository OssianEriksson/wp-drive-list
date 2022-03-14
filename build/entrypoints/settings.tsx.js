!function(){"use strict";var e={n:function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,{a:n}),n},d:function(t,n){for(var r in n)e.o(n,r)&&!e.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:n[r]})},o:function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}},t=window.wp.element,n=window.wp.components,r=window.wp.notices,l=window.wp.i18n,a=window.wp.data,c=window.wp.apiFetch,i=e.n(c);const o=e=>(0,t.createElement)(t.Fragment,null,(0,l.__)("The following error has occurred:","wp-drive-list"),(0,t.createElement)("pre",{className:"error"},JSON.stringify(e,null,4))),s=()=>{const e=(0,a.useSelect)((e=>e(r.store).getNotices())).filter((e=>"snackbar"===e.type)),{removeNotice:l}=(0,a.useDispatch)(r.store);return(0,t.createElement)(n.SnackbarList,{notices:e,onRemove:l})},u=()=>(0,t.createElement)(n.Placeholder,null,(0,t.createElement)("div",{className:"placeholder-center"},(0,t.createElement)(n.Spinner,null))),p=()=>{const[e,c]=(0,t.useState)(null),[s,p]=(0,t.useState)(null);(0,t.useEffect)((()=>{i()({path:"/wp/v2/settings"}).then((e=>{p(e?.wp_drive_list_option)})).catch((e=>c(e)))}),[]);const{createNotice:d}=(0,a.useDispatch)(r.store);return e?(0,t.createElement)(o,{error:e}):s?(0,t.createElement)(t.Fragment,null,(0,t.createElement)(n.TextControl,{label:(0,l.__)("Google API key","wp-drive-list"),value:s.api_key,onChange:e=>p({...s,api_key:e})}),(0,t.createElement)(n.Button,{onClick:()=>{i()({path:"/wp/v2/settings",method:"POST",data:{wp_drive_list_option:s}}).then((()=>d("success",(0,l.__)("Settings saved.","wp-drive-list"),{type:"snackbar"}))).catch((e=>d("error",e?.message||JSON.stringify(e),{type:"snackbar"})))},isPrimary:!0},(0,l.__)("Save changes","wp-drive-list"))):(0,t.createElement)(u,null)};var d=()=>(0,t.createElement)(t.Fragment,null,(0,t.createElement)("h1",null,(0,l.__)("WP Drive List Settings","wp-drive-list")),(0,t.createElement)(p,null),(0,t.createElement)(s,null));document.addEventListener("DOMContentLoaded",(()=>{const e=document.getElementById("wp_drive_list_settings");e&&(0,t.render)((0,t.createElement)(d,null),e)}))}();