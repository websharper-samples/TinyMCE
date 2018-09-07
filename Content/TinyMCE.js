// $begin{copyright}
//
// This file is part of WebSharper
//
// Copyright (c) 2008-2016 IntelliFactory
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You may
// obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.
//
// $end{copyright}

IntelliFactory = {
    Runtime: {
        Ctor: function (ctor, typeFunction) {
            ctor.prototype = typeFunction.prototype;
            return ctor;
        },

        Class: function (members, base, statics) {
            var proto = members;
            if (base) {
                proto = new base();
                for (var m in members) { proto[m] = members[m] }
            }
            var typeFunction = function (copyFrom) {
                if (copyFrom) {
                    for (var f in copyFrom) { this[f] = copyFrom[f] }
                }
            }
            typeFunction.prototype = proto;
            if (statics) {
                for (var f in statics) { typeFunction[f] = statics[f] }
            }
            return typeFunction;
        },

        Clone: function (obj) {
            var res = {};
            for (var p in obj) { res[p] = obj[p] }
            return res;
        },

        NewObject:
            function (kv) {
                var o = {};
                for (var i = 0; i < kv.length; i++) {
                    o[kv[i][0]] = kv[i][1];
                }
                return o;
            },

        DeleteEmptyFields:
            function (obj, fields) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (obj[f] === void (0)) { delete obj[f]; }
                }
                return obj;
            },

        GetOptional:
            function (value) {
                return (value === void (0)) ? null : { $: 1, $0: value };
            },

        SetOptional:
            function (obj, field, value) {
                if (value) {
                    obj[field] = value.$0;
                } else {
                    delete obj[field];
                }
            },

        SetOrDelete:
            function (obj, field, value) {
                if (value === void (0)) {
                    delete obj[field];
                } else {
                    obj[field] = value;
                }
            },

        Apply: function (f, obj, args) {
            return f.apply(obj, args);
        },

        Bind: function (f, obj) {
            return function () { return f.apply(this, arguments) };
        },

        CreateFuncWithArgs: function (f) {
            return function () { return f(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithOnlyThis: function (f) {
            return function () { return f(this) };
        },

        CreateFuncWithThis: function (f) {
            return function () { return f(this).apply(null, arguments) };
        },

        CreateFuncWithThisArgs: function (f) {
            return function () { return f(this)(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithRest: function (length, f) {
            return function () { return f(Array.prototype.slice.call(arguments, 0, length).concat([Array.prototype.slice.call(arguments, length)])) };
        },

        CreateFuncWithArgsRest: function (length, f) {
            return function () { return f([Array.prototype.slice.call(arguments, 0, length), Array.prototype.slice.call(arguments, length)]) };
        },

        BindDelegate: function (func, obj) {
            var res = func.bind(obj);
            res.$Func = func;
            res.$Target = obj;
            return res;
        },

        CreateDelegate: function (invokes) {
            if (invokes.length == 0) return null;
            if (invokes.length == 1) return invokes[0];
            var del = function () {
                var res;
                for (var i = 0; i < invokes.length; i++) {
                    res = invokes[i].apply(null, arguments);
                }
                return res;
            };
            del.$Invokes = invokes;
            return del;
        },

        CombineDelegates: function (dels) {
            var invokes = [];
            for (var i = 0; i < dels.length; i++) {
                var del = dels[i];
                if (del) {
                    if ("$Invokes" in del)
                        invokes = invokes.concat(del.$Invokes);
                    else
                        invokes.push(del);
                }
            }
            return IntelliFactory.Runtime.CreateDelegate(invokes);
        },

        DelegateEqual: function (d1, d2) {
            if (d1 === d2) return true;
            if (d1 == null || d2 == null) return false;
            var i1 = d1.$Invokes || [d1];
            var i2 = d2.$Invokes || [d2];
            if (i1.length != i2.length) return false;
            for (var i = 0; i < i1.length; i++) {
                var e1 = i1[i];
                var e2 = i2[i];
                if (!(e1 === e2 || ("$Func" in e1 && "$Func" in e2 && e1.$Func === e2.$Func && e1.$Target == e2.$Target)))
                    return false;
            }
            return true;
        },

        ThisFunc: function (d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args);
            };
        },

        ThisFuncOut: function (f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args);
            };
        },

        ParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return d.apply(null, args.slice(0, length).concat([args.slice(length)]));
            };
        },

        ParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(null, args.slice(0, length).concat(args[length]));
            };
        },

        ThisParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args.slice(0, length + 1).concat([args.slice(length + 1)]));
            };
        },

        ThisParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args.slice(0, length).concat(args[length]));
            };
        },

        Curried: function (f, n, args) {
            args = args || [];
            return function (a) {
                var allArgs = args.concat([a === void (0) ? null : a]);
                if (n == 1)
                    return f.apply(null, allArgs);
                if (n == 2)
                    return function (a) { return f.apply(null, allArgs.concat([a === void (0) ? null : a])); }
                return IntelliFactory.Runtime.Curried(f, n - 1, allArgs);
            }
        },

        Curried2: function (f) {
            return function (a) { return function (b) { return f(a, b); } }
        },

        Curried3: function (f) {
            return function (a) { return function (b) { return function (c) { return f(a, b, c); } } }
        },

        UnionByType: function (types, value, optional) {
            var vt = typeof value;
            for (var i = 0; i < types.length; i++) {
                var t = types[i];
                if (typeof t == "number") {
                    if (Array.isArray(value) && (t == 0 || value.length == t)) {
                        return { $: i, $0: value };
                    }
                } else {
                    if (t == vt) {
                        return { $: i, $0: value };
                    }
                }
            }
            if (!optional) {
                throw new Error("Type not expected for creating Choice value.");
            }
        },

        ScriptBasePath: "./",

        ScriptPath: function (a, f) {
            return this.ScriptBasePath + (this.ScriptSkipAssemblyDir ? "" : a + "/") + f;
        },

        OnLoad:
            function (f) {
                if (!("load" in this)) {
                    this.load = [];
                }
                this.load.push(f);
            },

        Start:
            function () {
                function run(c) {
                    for (var i = 0; i < c.length; i++) {
                        c[i]();
                    }
                }
                if ("load" in this) {
                    run(this.load);
                    this.load = [];
                }
            },
    }
}

IntelliFactory.Runtime.OnLoad(function () {
    if (self.WebSharper && WebSharper.Activator && WebSharper.Activator.Activate)
        WebSharper.Activator.Activate()
});

// Polyfill

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

if (!Math.trunc) {
    Math.trunc = function (x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }
}

if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
  }
}

function ignore() { };
function id(x) { return x };
function fst(x) { return x[0] };
function snd(x) { return x[1] };
function trd(x) { return x[2] };

if (!console) {
    console = {
        count: ignore,
        dir: ignore,
        error: ignore,
        group: ignore,
        groupEnd: ignore,
        info: ignore,
        log: ignore,
        profile: ignore,
        profileEnd: ignore,
        time: ignore,
        timeEnd: ignore,
        trace: ignore,
        warn: ignore
    }
};
(function()
{
 "use strict";
 var Global,WebSharper,TinyMce,Tests,Test,Obj,Html,Client,Pagelet,Operators,EventTarget,Node,JavaScript,JS,Tags,Formlet,DirectBindings,Plugin,WindowOrWorkerGlobalScope,TagBuilder,Formlets,Formlet$1,FormletBuilder,Controls,Enhance,TinyMce$1,Controls$1,SimpleHtmlEditorConfiguration,AdvancedHtmlEditorConfiguration,List,T,Operators$1,AttributeBuilder,Attr,EventsPervasives,tinymce,ui,Control,MenuItem,Menu,Button,Unchecked,SC$1,SC$2,IntelliFactory,Formlets$1,Base,FormletProvider,Data,FormContainerConfiguration,HtmlEditorConfiguration,FormButtonConfiguration,Arrays,Pervasives,Element,Implementation,JQueryHtmlProvider,DeprecatedTagBuilder,Text,Reactive,Reactive$1,LayoutProvider,LayoutUtils,Validator,ValidatorProvidor,Formlet$2,Formlet$3,HotStream,Form,Utils,Padding,Control$1,FSharpEvent,Utils$1,Seq,Attribute,SC$3,Enumerator,SC$4,Layout,FormRowConfiguration,Tree,Result,Edit,Body,Event,Event$1,T$1,Events,JQueryEventSupport,Reactive$2,ElementStore,Tree$1,Collections,List$1,Util,Dictionary,Padding$1,LabelConfiguration,Object,DictionaryUtil,Disposable,Observer,Runtime,tinyMCE,Math,PluginManager;
 Global=self;
 WebSharper=Global.WebSharper=Global.WebSharper||{};
 TinyMce=WebSharper.TinyMce=WebSharper.TinyMce||{};
 Tests=TinyMce.Tests=TinyMce.Tests||{};
 Test=Tests.Test=Tests.Test||{};
 Obj=WebSharper.Obj=WebSharper.Obj||{};
 Html=WebSharper.Html=WebSharper.Html||{};
 Client=Html.Client=Html.Client||{};
 Pagelet=Client.Pagelet=Client.Pagelet||{};
 Operators=WebSharper.Operators=WebSharper.Operators||{};
 EventTarget=Global.EventTarget;
 Node=Global.Node;
 JavaScript=WebSharper.JavaScript=WebSharper.JavaScript||{};
 JS=JavaScript.JS=JavaScript.JS||{};
 Tags=Client.Tags=Client.Tags||{};
 Formlet=Test.Formlet=Test.Formlet||{};
 DirectBindings=Test.DirectBindings=Test.DirectBindings||{};
 Plugin=Test.Plugin=Test.Plugin||{};
 WindowOrWorkerGlobalScope=Global.WindowOrWorkerGlobalScope;
 TagBuilder=Client.TagBuilder=Client.TagBuilder||{};
 Formlets=WebSharper.Formlets=WebSharper.Formlets||{};
 Formlet$1=Formlets.Formlet=Formlets.Formlet||{};
 FormletBuilder=Formlets.FormletBuilder=Formlets.FormletBuilder||{};
 Controls=Formlets.Controls=Formlets.Controls||{};
 Enhance=Formlets.Enhance=Formlets.Enhance||{};
 TinyMce$1=Formlets.TinyMce=Formlets.TinyMce||{};
 Controls$1=TinyMce$1.Controls=TinyMce$1.Controls||{};
 SimpleHtmlEditorConfiguration=TinyMce$1.SimpleHtmlEditorConfiguration=TinyMce$1.SimpleHtmlEditorConfiguration||{};
 AdvancedHtmlEditorConfiguration=TinyMce$1.AdvancedHtmlEditorConfiguration=TinyMce$1.AdvancedHtmlEditorConfiguration||{};
 List=WebSharper.List=WebSharper.List||{};
 T=List.T=List.T||{};
 Operators$1=Client.Operators=Client.Operators||{};
 AttributeBuilder=Client.AttributeBuilder=Client.AttributeBuilder||{};
 Attr=Client.Attr=Client.Attr||{};
 EventsPervasives=Client.EventsPervasives=Client.EventsPervasives||{};
 tinymce=Global.tinymce;
 ui=tinymce&&tinymce.ui;
 Control=ui&&ui.Control;
 MenuItem=ui&&ui.MenuItem;
 Menu=ui&&ui.Menu;
 Button=ui&&ui.Button;
 Unchecked=WebSharper.Unchecked=WebSharper.Unchecked||{};
 SC$1=Global.StartupCode$WebSharper_Html_Client$Html=Global.StartupCode$WebSharper_Html_Client$Html||{};
 SC$2=Global.StartupCode$WebSharper_Formlets$Formlet=Global.StartupCode$WebSharper_Formlets$Formlet||{};
 IntelliFactory=Global.IntelliFactory=Global.IntelliFactory||{};
 Formlets$1=IntelliFactory.Formlets=IntelliFactory.Formlets||{};
 Base=Formlets$1.Base=Formlets$1.Base||{};
 FormletProvider=Base.FormletProvider=Base.FormletProvider||{};
 Data=Formlets.Data=Formlets.Data||{};
 FormContainerConfiguration=Enhance.FormContainerConfiguration=Enhance.FormContainerConfiguration||{};
 HtmlEditorConfiguration=TinyMce$1.HtmlEditorConfiguration=TinyMce$1.HtmlEditorConfiguration||{};
 FormButtonConfiguration=Enhance.FormButtonConfiguration=Enhance.FormButtonConfiguration||{};
 Arrays=WebSharper.Arrays=WebSharper.Arrays||{};
 Pervasives=JavaScript.Pervasives=JavaScript.Pervasives||{};
 Element=Client.Element=Client.Element||{};
 Implementation=Client.Implementation=Client.Implementation||{};
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Implementation.JQueryHtmlProvider||{};
 DeprecatedTagBuilder=Client.DeprecatedTagBuilder=Client.DeprecatedTagBuilder||{};
 Text=Client.Text=Client.Text||{};
 Reactive=IntelliFactory.Reactive=IntelliFactory.Reactive||{};
 Reactive$1=Reactive.Reactive=Reactive.Reactive||{};
 LayoutProvider=Formlets.LayoutProvider=Formlets.LayoutProvider||{};
 LayoutUtils=Base.LayoutUtils=Base.LayoutUtils||{};
 Validator=Base.Validator=Base.Validator||{};
 ValidatorProvidor=Data.ValidatorProvidor=Data.ValidatorProvidor||{};
 Formlet$2=Base.Formlet=Base.Formlet||{};
 Formlet$3=Data.Formlet=Data.Formlet||{};
 HotStream=Reactive.HotStream=Reactive.HotStream||{};
 Form=Base.Form=Base.Form||{};
 Utils=Formlets.Utils=Formlets.Utils||{};
 Padding=Enhance.Padding=Enhance.Padding||{};
 Control$1=WebSharper.Control=WebSharper.Control||{};
 FSharpEvent=Control$1.FSharpEvent=Control$1.FSharpEvent||{};
 Utils$1=TinyMce$1.Utils=TinyMce$1.Utils||{};
 Seq=WebSharper.Seq=WebSharper.Seq||{};
 Attribute=Client.Attribute=Client.Attribute||{};
 SC$3=Global.StartupCode$WebSharper_Html_Client$Events=Global.StartupCode$WebSharper_Html_Client$Events||{};
 Enumerator=WebSharper.Enumerator=WebSharper.Enumerator||{};
 SC$4=Global.StartupCode$IntelliFactory_Reactive$Reactive=Global.StartupCode$IntelliFactory_Reactive$Reactive||{};
 Layout=Formlets.Layout=Formlets.Layout||{};
 FormRowConfiguration=Layout.FormRowConfiguration=Layout.FormRowConfiguration||{};
 Tree=Base.Tree=Base.Tree||{};
 Result=Base.Result=Base.Result||{};
 Edit=Tree.Edit=Tree.Edit||{};
 Body=Formlets.Body=Formlets.Body||{};
 Event=Control$1.Event=Control$1.Event||{};
 Event$1=Event.Event=Event.Event||{};
 T$1=Enumerator.T=Enumerator.T||{};
 Events=Client.Events=Client.Events||{};
 JQueryEventSupport=Events.JQueryEventSupport=Events.JQueryEventSupport||{};
 Reactive$2=Reactive$1.Reactive=Reactive$1.Reactive||{};
 ElementStore=Formlets.ElementStore=Formlets.ElementStore||{};
 Tree$1=Tree.Tree=Tree.Tree||{};
 Collections=WebSharper.Collections=WebSharper.Collections||{};
 List$1=Collections.List=Collections.List||{};
 Util=WebSharper.Util=WebSharper.Util||{};
 Dictionary=Collections.Dictionary=Collections.Dictionary||{};
 Padding$1=Layout.Padding=Layout.Padding||{};
 LabelConfiguration=Layout.LabelConfiguration=Layout.LabelConfiguration||{};
 Object=Global.Object;
 DictionaryUtil=Collections.DictionaryUtil=Collections.DictionaryUtil||{};
 Disposable=Reactive.Disposable=Reactive.Disposable||{};
 Observer=Reactive.Observer=Reactive.Observer||{};
 Runtime=IntelliFactory&&IntelliFactory.Runtime;
 tinyMCE=Global.tinyMCE;
 Math=Global.Math;
 PluginManager=tinymce&&tinymce.PluginManager;
 Test.Main=function()
 {
  Test.Run().AppendTo("main");
 };
 Test.Run=function()
 {
  var a;
  a=[Test.TestFormlet("SimpleHtmlEditor","Creates SimpleHtmlEditor with default configuration",Formlet.SimpleEditorDefaultConfiguration()),Test.TestFormlet("SimpleHtmlEditor","Creates SimpleHtmlEditor with custom configuration: width = 500, height = 500",Formlet.SimpleEditorCustomConfiguration()),Test.TestFormlet("AdvancedHtmlEditor","Creates AdvancedHtmlEditor with default configuration",Formlet.AdvancedEditorDefaultConfiguration()),Test.TestFormlet("AdvancedHtmlEditor","Creates AdvancedHtmlEditor with custom configuration: width = 600, height = 400, ToolbarLocation = Top, ToolbarAlign = Left, Plugins = table,contextmenu,paste, Only first row of Buttons = Bold, Anchor",Formlet.AdvancedEditorCustomConfiguration()),Test.TestDirectBindings("Creating TinyMCE with direct bindings","TinyMCE should be visible",DirectBindings.CreatingTinyMce()),Test.TestDirectBindings("Creating TinyMCE with direct bindings, Oninit callback","When TinyMCE is initialized p element below the editor should have the editor's content",DirectBindings.CreatingTinyMceWithOninitCallback()),Test.TestDirectBindings("Creating TinyMCE with direct bindings, Onchange callback","When TinyMCE content is changed JavaScript Alert dialog is shown with the editor's content",DirectBindings.CreatingTinyMceWithOnchangeCallback()),Test.TestDirectBindings("Creating TinyMCE with direct bindings, OnKeyUp event","When OnKeyUp event fires JavaScript alert box with editor's content is shown",DirectBindings.OnKeyupCallback()),Test.TestDirectBindings("Creating TinyMCE with direct bindings, OnClick event","When OnClick event fires JavaScript alert box with editor's content is shown",DirectBindings.OnClickCallback()),Test.TestDirectBindings("Using UndoManager to undo and redo changes","Buttons below undo and redo changes",DirectBindings.UndoManagerUndoAndRedoButtons()),Test.TestDirectBindings("The editor's selection","Clicking buttons below gets selection and replaces selected content",DirectBindings.EditorSelectionGetReplace()),Test.TestDirectBindings("Plugin: Custom ListBox and SplitButton","Toolbar should have custom ListBox and SplitButton",Plugin.CustomListBoxSplitButton()),Test.TestDirectBindings("Plugin: MenuButton","Toolbar should have custom MenuButton",Plugin.MenuButton()),Test.TestDirectBindings("Plugin: Custom toolbar button","Toolbar should have custom Button",Plugin.CustomToolbarButton())];
  return Tags.Tags().NewTag("div",a);
 };
 Test.TestFormlet=function(name,descr,formlet)
 {
  var a,a$1,a$2,a$3,b;
  a=[(a$1=[Tags.Tags().text(name)],Tags.Tags().NewTag("h3",a$1)),(a$2=[Tags.Tags().text(descr)],Tags.Tags().NewTag("p",a$2)),(a$3=[Enhance.WithFormContainer((b=Formlet$1.Do(),b.Delay(function()
  {
   return b.Bind(formlet,function(a$4)
   {
    return b.Bind(Controls.TextArea(a$4),function()
    {
     return b.Return();
    });
   });
  })))],Tags.Tags().NewTag("p",a$3))];
  return Tags.Tags().NewTag("div",a);
 };
 Test.TestDirectBindings=function(name,descr,element)
 {
  var a,a$1,a$2;
  a=[(a$1=[Tags.Tags().text(name)],Tags.Tags().NewTag("h3",a$1)),(a$2=[Tags.Tags().text(descr)],Tags.Tags().NewTag("p",a$2)),element];
  return Tags.Tags().NewTag("div",a);
 };
 Obj=WebSharper.Obj=Runtime.Class({
  Equals:function(obj)
  {
   return this===obj;
  },
  GetHashCode:function()
  {
   return -1;
  }
 },null,Obj);
 Obj.New=Runtime.Ctor(function()
 {
 },Obj);
 Pagelet=Client.Pagelet=Runtime.Class({
  AppendTo:function(targetId)
  {
   self.document.getElementById(targetId).appendChild(this.get_Body());
   this.Render();
  },
  Render:Global.ignore
 },Obj,Pagelet);
 Pagelet.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },Pagelet);
 Operators.FailWith=function(msg)
 {
  throw new Global.Error(msg);
 };
 Operators.KeyValue=function(kvp)
 {
  return[kvp.K,kvp.V];
 };
 JS.GetFieldValues=function(o)
 {
  var r,k;
  r=[];
  for(var k$1 in o)r.push(o[k$1]);
  return r;
 };
 Tags.Tags=function()
 {
  SC$1.$cctor();
  return SC$1.Tags$1;
 };
 Formlet.SimpleEditorDefaultConfiguration=function()
 {
  return Enhance.WithSubmitAndResetButtons((Controls$1.SimpleHtmlEditor(SimpleHtmlEditorConfiguration.get_Default()))("default"));
 };
 Formlet.SimpleEditorCustomConfiguration=function()
 {
  return Enhance.WithSubmitAndResetButtons((Controls$1.SimpleHtmlEditor(SimpleHtmlEditorConfiguration.New({
   $:1,
   $0:500
  },{
   $:1,
   $0:500
  })))("default"));
 };
 Formlet.AdvancedEditorDefaultConfiguration=function()
 {
  return Enhance.WithSubmitAndResetButtons((Controls$1.AdvancedHtmlEditor(AdvancedHtmlEditorConfiguration.get_Default()))("default"));
 };
 Formlet.AdvancedEditorCustomConfiguration=function()
 {
  var i;
  return Enhance.WithSubmitAndResetButtons((Controls$1.AdvancedHtmlEditor((i=AdvancedHtmlEditorConfiguration.get_Default(),AdvancedHtmlEditorConfiguration.New({
   $:1,
   $0:600
  },{
   $:1,
   $0:400
  },i.Plugins,{
   $:1,
   $0:"top"
  },{
   $:1,
   $0:"left"
  },i.StatusbarLocation,{
   $:1,
   $0:List.ofArray([List.ofArray([{
    $:0
   },{
    $:37
   }]),T.Empty,T.Empty])
  }))))("default"));
 };
 DirectBindings.CreatingTinyMce=function()
 {
  var tId,a,x,a$1;
  function Init(tId$1)
  {
   var r;
   tinyMCE.init((r={},r.theme="advanced",r.mode="exact",r.elements=tId$1,r));
  }
  function f(el)
  {
   Init(tId);
  }
  tId="id"+Math.round(Math.random()*100000000);
  a=[(x=(a$1=[Attr.Attr().NewAttr("id",tId),Tags.Tags().text("default content")],Tags.Tags().NewTag("textarea",a$1)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x))];
  return Tags.Tags().NewTag("div",a);
 };
 DirectBindings.CreatingTinyMceWithOninitCallback=function()
 {
  var tId,a,a$1,x,a$2;
  function Init(tId$1)
  {
   var r;
   tinyMCE.init((r={},r.theme="advanced",r.mode="exact",r.elements=tId$1,r.oninit=function()
   {
    var editor;
    editor=tinyMCE.get(tId$1);
    return Global.jQuery("#change_on_init").html("Oninit event executed, editor content: "+editor.getContent());
   },r));
  }
  function f(el)
  {
   Init(tId);
  }
  tId="id"+Math.round(Math.random()*100000000);
  a=[(a$1=[Attr.Attr().NewAttr("id",tId),Tags.Tags().text("default content: oninit")],Tags.Tags().NewTag("textarea",a$1)),(x=(a$2=[Attr.Attr().NewAttr("id","change_on_init")],Tags.Tags().NewTag("p",a$2)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x))];
  return Tags.Tags().NewTag("div",a);
 };
 DirectBindings.CreatingTinyMceWithOnchangeCallback=function()
 {
  var tId,a,x,a$1;
  function Init(tId$1)
  {
   var r;
   tinyMCE.init((r={},r.theme="advanced",r.mode="exact",r.elements=tId$1,r.onchange_callback=function(ed)
   {
    return Global.alert(ed.getContent());
   },r));
  }
  function f(el)
  {
   Init(tId);
  }
  tId="id"+Math.round(Math.random()*100000000);
  a=[(x=(a$1=[Attr.Attr().NewAttr("id",tId),Tags.Tags().text("default content")],Tags.Tags().NewTag("textarea",a$1)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x))];
  return Tags.Tags().NewTag("div",a);
 };
 DirectBindings.OnKeyupCallback=function()
 {
  var tId,a,x,a$1;
  function Init(tId$1)
  {
   var r;
   tinyMCE.init((r={},r.theme="advanced",r.mode="exact",r.elements=tId$1,r.oninit=function()
   {
    tinyMCE.get(tId$1).onKeyUp.add(function(ed)
    {
     return Global.alert(ed.getContent());
    });
   },r));
  }
  function f(el)
  {
   Init(tId);
  }
  tId="id"+Math.round(Math.random()*100000000);
  a=[(x=(a$1=[Attr.Attr().NewAttr("id",tId),Tags.Tags().text("default content")],Tags.Tags().NewTag("textarea",a$1)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x))];
  return Tags.Tags().NewTag("div",a);
 };
 DirectBindings.OnClickCallback=function()
 {
  var tId,a,x,a$1;
  function Init(tId$1)
  {
   var r;
   tinyMCE.init((r={},r.theme="advanced",r.mode="exact",r.elements=tId$1,r.oninit=function()
   {
    tinyMCE.get(tId$1).onClick.add(function(ed)
    {
     return Global.alert(ed.getContent());
    });
   },r));
  }
  function f(el)
  {
   Init(tId);
  }
  tId="id"+Math.round(Math.random()*100000000);
  a=[(x=(a$1=[Attr.Attr().NewAttr("id",tId),Tags.Tags().text("default content")],Tags.Tags().NewTag("textarea",a$1)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x))];
  return Tags.Tags().NewTag("div",a);
 };
 DirectBindings.UndoManagerUndoAndRedoButtons=function()
 {
  var tId,a,x,a$1,x$1,a$2,x$2,a$3;
  function Init(tId$1)
  {
   var r;
   tinyMCE.init((r={},r.theme="advanced",r.mode="exact",r.elements=tId$1,r));
  }
  function f(el)
  {
   Init(tId);
  }
  function a$4(el,e)
  {
   tinyMCE.get(tId).undoManager.undo();
  }
  function a$5(el,e)
  {
   tinyMCE.get(tId).undoManager.redo();
  }
  tId="id"+Math.round(Math.random()*100000000);
  a=[(x=(a$1=[Attr.Attr().NewAttr("id",tId),Tags.Tags().text("default content")],Tags.Tags().NewTag("textarea",a$1)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x)),(x$1=(a$2=[Tags.Tags().text("undo")],Tags.Tags().NewTag("button",a$2)),(function(a$6)
  {
   EventsPervasives.Events().OnClick(function($1)
   {
    return function($2)
    {
     return a$4($1,$2);
    };
   },a$6);
  }(x$1),x$1)),(x$2=(a$3=[Tags.Tags().text("redo")],Tags.Tags().NewTag("button",a$3)),(function(a$6)
  {
   EventsPervasives.Events().OnClick(function($1)
   {
    return function($2)
    {
     return a$5($1,$2);
    };
   },a$6);
  }(x$2),x$2))];
  return Tags.Tags().NewTag("div",a);
 };
 DirectBindings.EditorSelectionGetReplace=function()
 {
  var tId,a,x,a$1,x$1,a$2,x$2,a$3;
  function Init(tId$1)
  {
   var r;
   tinyMCE.init((r={},r.theme="advanced",r.mode="exact",r.elements=tId$1,r));
  }
  function f(el)
  {
   Init(tId);
  }
  function a$4(el,e)
  {
   return Global.alert(tinyMCE.get(tId).selection.getContent());
  }
  function a$5(el,e)
  {
   return tinyMCE.get(tId).selection.setContent("foo");
  }
  tId="id"+Math.round(Math.random()*100000000);
  a=[(x=(a$1=[Attr.Attr().NewAttr("id",tId),Tags.Tags().text("default content")],Tags.Tags().NewTag("textarea",a$1)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x)),(x$1=(a$2=[Tags.Tags().text("get selection")],Tags.Tags().NewTag("button",a$2)),(function(a$6)
  {
   EventsPervasives.Events().OnClick(function($1)
   {
    return function($2)
    {
     return a$4($1,$2);
    };
   },a$6);
  }(x$1),x$1)),(x$2=(a$3=[Tags.Tags().text("replace selection with foo")],Tags.Tags().NewTag("button",a$3)),(function(a$6)
  {
   EventsPervasives.Events().OnClick(function($1)
   {
    return function($2)
    {
     return a$5($1,$2);
    };
   },a$6);
  }(x$2),x$2))];
  return Tags.Tags().NewTag("div",a);
 };
 Plugin.CustomListBoxSplitButton=function()
 {
  var tId,a,x,a$1;
  function Init(tId$1)
  {
   var listBoxConf,r,splitButtonConf,r$1,r$2,r$3;
   listBoxConf=(r={},r.title="My list box",r.onselect=function(v)
   {
    return tinyMCE.activeEditor.windowManager.alert("Value selected:"+v);
   },r);
   splitButtonConf=(r$1={},r$1.title="My split button",r$1.image="img/example.gif",r$1.onclick=function()
   {
    return tinyMCE.activeEditor.windowManager.alert("Button was clicked.");
   },r$1);
   tinyMCE.create("tinymce.plugins.CustomListBoxSplitButtonPlugin",(r$2={},r$2.createControl=function(name,cm)
   {
    var mlb,c,_this;
    function a$2(c$1,m)
    {
     var r$4,r$5,r$6;
     m.add((r$4={},r$4.title="Some title",r$4["class"]="mceMenuItemTitle",r$4));
     m.add((r$5={},r$5.title="Some item 1",r$5.onclick=function()
     {
      return tinyMCE.activeEditor.windowManager.alert("Some  item 1 was clicked");
     },r$5));
     m.add((r$6={},r$6.title="Some item 2",r$6.onclick=function()
     {
      return tinyMCE.activeEditor.windowManager.alert("Some  item 2 was clicked");
     },r$6));
    }
    return name==="mylistbox"?(mlb=cm.createListBox("mylistbox",listBoxConf),(mlb.add("Some item 1","val1"),mlb.add("Some item 2","val2"),mlb.add("Some item 3","val3"),mlb)):name==="mysplitbutton"?(c=cm.createSplitButton("mysplitbutton",splitButtonConf),(_this=c.onRenderMenu,c)):null;
   },r$2));
   PluginManager.add("exampleCustomListBoxSplitButton",Global["eval"]("tinymce.plugins.CustomListBoxSplitButtonPlugin"));
   tinyMCE.init((r$3={},r$3.theme="advanced",r$3.mode="exact",r$3.elements=tId$1,r$3.theme_advanced_toolbar_location="top",r$3.plugins="-exampleCustomListBoxSplitButton",r$3.theme_advanced_buttons1="mylistbox,mysplitbutton,bold",r$3.theme_advanced_buttons2="",r$3.theme_advanced_buttons3="",r$3.theme_advanced_buttons4="",r$3));
  }
  function f(el)
  {
   Init(tId);
  }
  tId="id"+Math.round(Math.random()*100000000);
  a=[(x=(a$1=[Attr.Attr().NewAttr("id",tId),Tags.Tags().text("default content")],Tags.Tags().NewTag("textarea",a$1)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x))];
  return Tags.Tags().NewTag("div",a);
 };
 Plugin.MenuButton=function()
 {
  var tId,a,x,a$1;
  function Init(tId$1)
  {
   var menuConf,r,r$1,r$2;
   menuConf=(r={},r.title="My menu button",r.image="img/example.gif",r.icons=false,r);
   tinyMCE.create("tinymce.plugins.MenuButtonPlugin",(r$1={},r$1.createControl=function(name,ctrlMgr)
   {
    var c,_this;
    function a$2(o,m)
    {
     var r$3,r$4,sub,r$5,r$6,r$7;
     m.add((r$3={},r$3.title="Some item 1",r$3.onclick=function()
     {
      return tinyMCE.activeEditor.execCommand("mceInsertContent",false,"Some item 1");
     },r$3));
     m.add((r$4={},r$4.title="Some item 2",r$4.onclick=function()
     {
      return tinyMCE.activeEditor.execCommand("mceInsertContent",false,"Some item 2");
     },r$4));
     sub=m.addMenu((r$5={},r$5.title="Some item 3",r$5));
     sub.add((r$6={},r$6.title="Some item 3.1",r$6.onclick=function()
     {
      return tinyMCE.activeEditor.execCommand("mceInsertContent",false,"Some item 3.1");
     },r$6));
     sub.add((r$7={},r$7.title="Some item 3.2",r$7.onclick=function()
     {
      return tinyMCE.activeEditor.execCommand("mceInsertContent",false,"Some item 3.2");
     },r$7));
    }
    return name==="mymenubutton"?(c=ctrlMgr.createMenuButton("mymenubutton",menuConf),(_this=c.onRenderMenu,c)):null;
   },r$1));
   PluginManager.add("exampleMenuButton",Global["eval"]("tinymce.plugins.MenuButtonPlugin"));
   tinyMCE.init((r$2={},r$2.theme="advanced",r$2.mode="exact",r$2.elements=tId$1,r$2.theme_advanced_toolbar_location="top",r$2.plugins="-exampleMenuButton",r$2.theme_advanced_buttons1="mymenubutton,bold",r$2.theme_advanced_buttons2="",r$2.theme_advanced_buttons3="",r$2.theme_advanced_buttons4="",r$2));
  }
  function f(el)
  {
   Init(tId);
  }
  tId="id"+Math.round(Math.random()*100000000);
  a=[(x=(a$1=[Attr.Attr().NewAttr("id",tId),Tags.Tags().text("default content")],Tags.Tags().NewTag("textarea",a$1)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x))];
  return Tags.Tags().NewTag("div",a);
 };
 Plugin.CustomToolbarButton=function()
 {
  var tId,a,x,a$1;
  function Init(tId$1)
  {
   var r;
   tinyMCE.init((r={},r.theme="advanced",r.mode="exact",r.elements=tId$1,r.theme_advanced_toolbar_location="top",r.theme_advanced_buttons1="mybutton,bold",r.theme_advanced_buttons2="",r.theme_advanced_buttons3="",r.theme_advanced_buttons4="",r.setup=function(ed)
   {
    var r$1;
    return ed.addButton("mybutton",(r$1={},r$1.title="My button",r$1.image="img/example.gif",r$1.onclick=function()
    {
     ed.focus(false);
     return ed.selection.setContent("Hello world!");
    },r$1));
   },r));
  }
  function f(el)
  {
   Init(tId);
  }
  tId="id"+Math.round(Math.random()*100000000);
  a=[(x=(a$1=[Attr.Attr().NewAttr("id",tId),Tags.Tags().text("default content")],Tags.Tags().NewTag("textarea",a$1)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x))];
  return Tags.Tags().NewTag("div",a);
 };
 TagBuilder=Client.TagBuilder=Runtime.Class({
  NewTag:function(name,children)
  {
   var el,e;
   el=Element.New(this.HtmlProvider,name);
   e=Enumerator.Get(children);
   try
   {
    while(e.MoveNext())
     el.AppendI(e.Current());
   }
   finally
   {
    if(typeof e=="object"&&"Dispose"in e)
     e.Dispose();
   }
   return el;
  },
  text:function(data)
  {
   return new Text.New(data);
  }
 },Obj,TagBuilder);
 TagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },TagBuilder);
 Formlet$1.Do=function()
 {
  SC$2.$cctor();
  return SC$2.Do;
 };
 Formlet$1.ApplyLayout=function(formlet)
 {
  return Data.OfIFormlet(Data.PropagateRenderFrom(formlet,Data.BaseFormlet().ApplyLayout(formlet)));
 };
 Formlet$1.MapElement=function(f,formlet)
 {
  return Data.OfIFormlet(Data.PropagateRenderFrom(formlet,Data.BaseFormlet().MapBody(function(b)
  {
   return Body.New(f(b.Element),b.Label);
  },formlet)));
 };
 Formlet$1.BuildFormlet=function(f)
 {
  return Data.MkFormlet(f);
 };
 Formlet$1.Return=function(x)
 {
  return Data.OfIFormlet(Data.BaseFormlet().Return(x));
 };
 Formlet$1.WithLayout=function(l,formlet)
 {
  return Data.OfIFormlet(Data.PropagateRenderFrom(formlet,Data.BaseFormlet().WithLayout(l,formlet)));
 };
 Formlet$1.LiftResult=function(formlet)
 {
  return Data.OfIFormlet(Data.PropagateRenderFrom(formlet,Data.BaseFormlet().LiftResult(formlet)));
 };
 Formlet$1.MapResult=function(f,formlet)
 {
  return Data.OfIFormlet(Data.PropagateRenderFrom(formlet,Data.BaseFormlet().MapResult(f,formlet)));
 };
 Formlet$1.Map=function(f,formlet)
 {
  return Data.OfIFormlet(Data.PropagateRenderFrom(formlet,Data.BaseFormlet().Map(f,formlet)));
 };
 Formlet$1.InitWithFailure=function(formlet)
 {
  return Data.OfIFormlet(Data.PropagateRenderFrom(formlet,Data.BaseFormlet().InitWithFailure(formlet)));
 };
 Formlet$1.WithNotificationChannel=function(formlet)
 {
  return Data.OfIFormlet(Data.PropagateRenderFrom(formlet,Data.BaseFormlet().WithNotificationChannel(formlet)));
 };
 FormletBuilder=Formlets.FormletBuilder=Runtime.Class({
  Delay:function(f)
  {
   return Data.OfIFormlet(Data.BaseFormlet().Delay(f));
  },
  Bind:function(formlet,f)
  {
   return Data.OfIFormlet(Data.PropagateRenderFrom(formlet,Data.BaseFormlet().Bind(formlet,f)));
  },
  Return:function(x)
  {
   return Data.OfIFormlet(Data.BaseFormlet().Return(x));
  },
  ReturnFrom:function(f)
  {
   return Data.OfIFormlet(f);
  }
 },Obj,FormletBuilder);
 FormletBuilder.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },FormletBuilder);
 Controls.TextArea=function(value)
 {
  return Controls.TextAreaControl(false,value);
 };
 Controls.TextAreaControl=function(readOnly,value)
 {
  return Controls.InputControl(value,function(state)
  {
   var input,x;
   function f()
   {
    if(!readOnly)
     state.Trigger({
      $:0,
      $0:input.get_Value()
     });
   }
   input=(x=readOnly?List.ofArray([Attr.Attr().NewAttr("readonly","readonly")]):T.Empty,Tags.Tags().NewTag("textarea",x));
   (function(c)
   {
    Controls.OnTextChange(f,c);
   }(input));
   return input;
  });
 };
 Controls.InputControl=function(value,f)
 {
  return Data.MkFormlet(function()
  {
   var state,body;
   state=HotStream.New$1({
    $:0,
    $0:value
   });
   body=f(state);
   body.set_Value(value);
   return[body,function()
   {
    body.set_Value(value);
    state.Trigger({
     $:0,
     $0:value
    });
   },state];
  });
 };
 Controls.OnTextChange=function(f,control)
 {
  var value;
  function up()
  {
   if(control.get_Value()!==value[0])
    {
     value[0]=control.get_Value();
     f();
    }
  }
  function x(a$2)
  {
   up();
  }
  function a(el,a$2)
  {
   return x(el);
  }
  function a$1(a$2,a$3)
  {
   return up();
  }
  value=[control.get_Value()];
  EventsPervasives.Events().OnChange(function($1)
  {
   return function($2)
   {
    return a($1,$2);
   };
  },control);
  EventsPervasives.Events().OnKeyUp(function($1)
  {
   return function($2)
   {
    return a$1($1,$2);
   };
  },control);
  control.Dom.oninput=up;
 };
 Enhance.WithFormContainer=function(formlet)
 {
  return Enhance.WithCustomFormContainer(FormContainerConfiguration.get_Default(),formlet);
 };
 Enhance.WithSubmitAndResetButtons=function(formlet)
 {
  var i,i$1;
  return Enhance.WithCustomSubmitAndResetButtons((i=FormButtonConfiguration.get_Default(),FormButtonConfiguration.New({
   $:1,
   $0:"Submit"
  },i.Style,i.Class)),(i$1=FormButtonConfiguration.get_Default(),FormButtonConfiguration.New({
   $:1,
   $0:"Reset"
  },i$1.Style,i$1.Class)),formlet);
 };
 Enhance.WithCustomFormContainer=function(fc,formlet)
 {
  return Formlet$1.MapElement(function(formEl)
  {
   var description,tb,a,cell,a$1,m,m$1,a$2,a$3;
   function a$4(name,value)
   {
    if(value==null)
     ;
    else
     cell.HtmlProvider.SetCss(cell.get_Body(),name,value.$0);
   }
   description=Utils.Maybe(T.Empty,function(descr)
   {
    var a$5;
    return descr.$==1?List.ofArray([descr.$0()]):List.ofArray([(a$5=[Tags.Tags().text(descr.$0)],Tags.Tags().NewTag("p",a$5))]);
   },fc.Description);
   tb=Utils.Maybe(Utils.InTable(List.ofArray([List.ofArray([Operators$1.add((a=[Attr.Attr().NewAttr("class","headerPanel")],Tags.Tags().NewTag("div",a)),description)]),List.ofArray([formEl])])),function(formElem)
   {
    var hdr,a$5,a$6;
    return Utils.InTable(List.ofArray([List.ofArray([(hdr=formElem.$==1?formElem.$0():(a$5=[Tags.Tags().text(formElem.$0)],Tags.Tags().NewTag("h1",a$5)),Operators$1.add((a$6=[Attr.Attr().NewAttr("class","headerPanel")],Tags.Tags().NewTag("div",a$6)),new T({
     $:1,
     $0:hdr,
     $1:description
    })))]),List.ofArray([formEl])]));
   },fc.Header);
   cell=Operators$1.add((a$1=[Attr.Attr().NewAttr("class","formlet")],Tags.Tags().NewTag("td",a$1)),[tb]);
   Utils.Maybe(null,function(color)
   {
    cell.HtmlProvider.SetStyle(cell.get_Body(),"border-color: "+color);
   },fc.BorderColor);
   List.iter(function($1)
   {
    return a$4($1[0],$1[1]);
   },List.ofArray([["background-color",Utils.MapOption(Global.id,fc.BackgroundColor)],["padding-left",Utils.MapOption(function(v)
   {
    return Global.String(v)+"px";
   },fc.Padding.Left)],["padding-right",Utils.MapOption(function(v)
   {
    return Global.String(v)+"px";
   },fc.Padding.Right)],["padding-top",Utils.MapOption(function(v)
   {
    return Global.String(v)+"px";
   },fc.Padding.Top)],["padding-bottom",Utils.MapOption(function(v)
   {
    return Global.String(v)+"px";
   },fc.Padding.Bottom)]]));
   m=fc.Style;
   m==null?void 0:cell.HtmlProvider.SetStyle(cell.get_Body(),m.$0);
   m$1=fc.CssClass;
   m$1==null?void 0:cell.HtmlProvider.AddClass(cell.get_Body(),m$1.$0);
   a$2=[(a$3=[Tags.Tags().NewTag("tr",[cell])],Tags.Tags().NewTag("tbody",a$3))];
   return Tags.Tags().NewTag("table",a$2);
  },Formlet$1.ApplyLayout(formlet));
 };
 Enhance.WithCustomSubmitAndResetButtons=function(submitConf,resetConf,formlet)
 {
  return Enhance.WithSubmitAndReset(formlet,function(reset,result)
  {
   var submit,fs,value,reset$1,b,x;
   submit=result.$==1?(fs=result.$0,Formlet$1.MapResult(function()
   {
    return{
     $:1,
     $0:fs
    };
   },Enhance.InputButton(submitConf,false))):(value=result.$0,Formlet$1.Map(function()
   {
    return value;
   },Enhance.InputButton(submitConf,true)));
   reset$1=(b=Formlet$1.Do(),b.Delay(function()
   {
    return b.Bind(Formlet$1.LiftResult(Enhance.InputButton(resetConf,true)),function(a)
    {
     a.$==0?reset():void 0;
     return b.Return();
    });
   }));
   x=Data.$(Data.$(Formlet$1.Return(function(v)
   {
    return function()
    {
     return v;
    };
   }),submit),reset$1);
   return Formlet$1.WithLayout(Data.Layout().get_Horizontal(),x);
  });
 };
 Enhance.WithSubmitAndReset=function(formlet,submReset)
 {
  var b;
  return Data.OfIFormlet(Data.PropagateRenderFrom(formlet,(b=Formlet$1.Do(),b.Delay(function()
  {
   return b.Bind(Formlet$1.WithNotificationChannel(Formlet$1.LiftResult(Formlet$1.InitWithFailure(formlet))),function(a)
   {
    var notify;
    notify=a[1];
    return b.ReturnFrom(submReset(function()
    {
     notify(void 0);
    },a[0]));
   });
  }))));
 };
 Enhance.InputButton=function(conf,enabled)
 {
  return Data.MkFormlet(function()
  {
   var state,count,submit,label,submit$1,x,a,m,m$1;
   function a$1(a$2,a$3)
   {
    count[0]++;
    return state.Trigger({
     $:0,
     $0:count[0]
    });
   }
   state=HotStream.New$1({
    $:1,
    $0:T.Empty
   });
   count=[0];
   submit=(label=Utils.Maybe("Submit",Global.id,conf.Label),(submit$1=(x=Operators$1.add((a=[Attr.Attr().NewAttr("type","button")],Tags.Tags().NewTag("input",a)),[Attr.Attr().NewAttr("class","submitButton"),Attr.Attr().NewAttr("value",label)]),(function(a$2)
   {
    EventsPervasives.Events().OnClick(function($1)
    {
     return function($2)
     {
      return a$1($1,$2);
     };
    },a$2);
   }(x),x)),(!enabled?submit$1.HtmlProvider.AddClass(submit$1.get_Body(),"disabledButton"):void 0,m=conf.Style,m!=null&&m.$==1?submit$1.HtmlProvider.SetStyle(submit$1.get_Body(),m.$0):void 0,m$1=conf.Class,m$1!=null&&m$1.$==1?submit$1.HtmlProvider.AddClass(submit$1.get_Body(),m$1.$0):void 0,submit$1)));
   state.Trigger({
    $:1,
    $0:T.Empty
   });
   return[submit,function()
   {
    count[0]=0;
    state.Trigger({
     $:1,
     $0:T.Empty
    });
   },state];
  });
 };
 Controls$1.SimpleHtmlEditor=function(conf)
 {
  var c,i;
  c=(i=HtmlEditorConfiguration.get_Default(),HtmlEditorConfiguration.New({
   $:0
  },conf.Width,conf.Height,i.Plugins,i.AdvancedToolbarLocation,i.AdvancedToolbarAlign,i.AdvancedStatusbarLocation,i.AdvancedButtons));
  return function(d)
  {
   return Controls$1.HtmlEditor(c,d);
  };
 };
 Controls$1.AdvancedHtmlEditor=function(conf)
 {
  var c;
  c=HtmlEditorConfiguration.New({
   $:1
  },conf.Width,conf.Height,conf.Plugins,conf.ToolbarLocation,conf.ToolbarAlign,conf.StatusbarLocation,conf.Buttons);
  return function(d)
  {
   return Controls$1.HtmlEditor(c,d);
  };
 };
 Controls$1.HtmlEditor=function(conf,defContent)
 {
  return Formlet$1.BuildFormlet(function()
  {
   var state,oldValue,tId,tConf,tConf$1,r,m,m$1,m$2,m$3,m$4,m$5,m$6,x,a;
   function trigger(v)
   {
    var m$7;
    function t()
    {
     oldValue[0]={
      $:1,
      $0:v
     };
     state.event.Trigger({
      $:0,
      $0:v
     });
    }
    m$7=oldValue[0];
    m$7==null?t():v!==m$7.$0?t():void 0;
   }
   function f(el)
   {
    tinyMCE.init(tConf);
    trigger(defContent);
   }
   state=new FSharpEvent.New();
   oldValue=[null];
   tId="id"+Math.round(Math.random()*100000000);
   tConf=(tConf$1=(r={},r.theme=Utils$1.ShowTheme(conf.Theme),r.mode="exact",r.elements=tId,r.onchange_callback=function(tMce)
   {
    return trigger(tMce.getContent());
   },r.oninit=function()
   {
    tinyMCE.get(tId).onKeyUp.add(function(e)
    {
     return trigger(e.getContent());
    });
   },r),(m=conf.Height,m==null?void 0:tConf$1.height=Global.String(m.$0)+"px",m$1=conf.Width,m$1==null?void 0:tConf$1.width=Global.String(m$1.$0)+"px",m$2=conf.Plugins,m$2==null?void 0:tConf$1.plugins=m$2.$0,m$3=conf.AdvancedToolbarAlign,m$3==null?void 0:tConf$1.theme_advanced_toolbar_align=m$3.$0,m$4=conf.AdvancedStatusbarLocation,m$4==null?void 0:tConf$1.theme_advanced_statusbar_location=m$4.$0,m$5=conf.AdvancedToolbarLocation,m$5==null?void 0:tConf$1.theme_advanced_toolbar_location=m$5.$0,m$6=conf.AdvancedButtons,m$6==null?void 0:List.iteri(function(ix,row)
   {
    return row.$==0?void(tConf$1["theme_advanced_buttons"+Global.String(ix+1)]=""):void(tConf$1["theme_advanced_buttons"+Global.String(ix+1)]=Seq.reduce(function(x$1,y)
    {
     return x$1+","+y;
    },Seq.map(Utils$1.ShowButtonType,row)));
   },m$6.$0),tConf$1));
   return[(x=(a=[Attr.Attr().NewAttr("id",tId),Tags.Tags().text(defContent)],Tags.Tags().NewTag("textarea",a)),(function(w)
   {
    Operators$1.OnAfterRender(f,w);
   }(x),x)),function()
   {
    tinyMCE.get(tId).setContent(defContent);
    trigger(defContent);
   },state.event];
  });
 };
 SimpleHtmlEditorConfiguration.get_Default=function()
 {
  return SimpleHtmlEditorConfiguration.New(null,null);
 };
 SimpleHtmlEditorConfiguration.New=function(Width,Height)
 {
  return{
   Width:Width,
   Height:Height
  };
 };
 AdvancedHtmlEditorConfiguration.get_Default=function()
 {
  return AdvancedHtmlEditorConfiguration.New(null,null,null,null,null,null,null);
 };
 AdvancedHtmlEditorConfiguration.New=function(Width,Height,Plugins,ToolbarLocation,ToolbarAlign,StatusbarLocation,Buttons)
 {
  return{
   Width:Width,
   Height:Height,
   Plugins:Plugins,
   ToolbarLocation:ToolbarLocation,
   ToolbarAlign:ToolbarAlign,
   StatusbarLocation:StatusbarLocation,
   Buttons:Buttons
  };
 };
 List.ofArray=function(arr)
 {
  var r,i,$1;
  r=T.Empty;
  for(i=Arrays.length(arr)-1,$1=0;i>=$1;i--)r=new T({
   $:1,
   $0:Arrays.get(arr,i),
   $1:r
  });
  return r;
 };
 List.iter=function(f,l)
 {
  var r;
  r=l;
  while(r.$==1)
   {
    f(List.head(r));
    r=List.tail(r);
   }
 };
 List.iteri=function(f,l)
 {
  var r,i;
  r=l;
  i=0;
  while(r.$==1)
   {
    f(i,List.head(r));
    r=List.tail(r);
    i=i+1;
   }
 };
 List.map=function(f,x)
 {
  var r,l,go,res,t;
  if(x.$==0)
   return x;
  else
   {
    res=new T({
     $:1
    });
    r=res;
    l=x;
    go=true;
    while(go)
     {
      r.$0=f(l.$0);
      l=l.$1;
      l.$==0?go=false:r=(t=new T({
       $:1
      }),r.$1=t,t);
     }
    r.$1=T.Empty;
    return res;
   }
 };
 List.head=function(l)
 {
  return l.$==1?l.$0:List.listEmpty();
 };
 List.tail=function(l)
 {
  return l.$==1?l.$1:List.listEmpty();
 };
 List.listEmpty=function()
 {
  return Operators.FailWith("The input list was empty.");
 };
 List.append=function(x,y)
 {
  var r,l,go,res,t;
  if(x.$==0)
   return y;
  else
   if(y.$==0)
    return x;
   else
    {
     res=new T({
      $:1
     });
     r=res;
     l=x;
     go=true;
     while(go)
      {
       r.$0=l.$0;
       l=l.$1;
       l.$==0?go=false:r=(t=new T({
        $:1
       }),r.$1=t,t);
      }
     r.$1=y;
     return res;
    }
 };
 T=List.T=Runtime.Class({
  GetEnumerator:function()
  {
   return new T$1.New(this,null,function(e)
   {
    var m;
    m=e.s;
    return m.$==0?false:(e.c=m.$0,e.s=m.$1,true);
   },void 0);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get(this);
  }
 },null,T);
 T.Empty=new T({
  $:0
 });
 Operators$1.OnAfterRender=function(f,w)
 {
  var r;
  r=w.Render;
  w.Render=function()
  {
   r.apply(w);
   f(w);
  };
 };
 Operators$1.add=function(el,inner)
 {
  var e;
  e=Enumerator.Get(inner);
  try
  {
   while(e.MoveNext())
    el.AppendI(e.Current());
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return el;
 };
 AttributeBuilder=Client.AttributeBuilder=Runtime.Class({
  NewAttr:function(name,value)
  {
   return Attribute.New(this.HtmlProvider,name,value);
  }
 },Obj,AttributeBuilder);
 AttributeBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },AttributeBuilder);
 Attr.Attr=function()
 {
  SC$1.$cctor();
  return SC$1.Attr$1;
 };
 EventsPervasives.Events=function()
 {
  SC$3.$cctor();
  return SC$3.Events;
 };
 Unchecked.Equals=function(a,b)
 {
  var m,eqR,k,k$1;
  if(a===b)
   return true;
  else
   {
    m=typeof a;
    if(m=="object")
    {
     if(a===null||a===void 0||b===null||b===void 0)
      return false;
     else
      if("Equals"in a)
       return a.Equals(b);
      else
       if(a instanceof Global.Array&&b instanceof Global.Array)
        return Unchecked.arrayEquals(a,b);
       else
        if(a instanceof Global.Date&&b instanceof Global.Date)
         return Unchecked.dateEquals(a,b);
        else
         {
          eqR=[true];
          for(var k$2 in a)if(function(k$3)
          {
           eqR[0]=!a.hasOwnProperty(k$3)||b.hasOwnProperty(k$3)&&Unchecked.Equals(a[k$3],b[k$3]);
           return!eqR[0];
          }(k$2))
           break;
          if(eqR[0])
           {
            for(var k$3 in b)if(function(k$4)
            {
             eqR[0]=!b.hasOwnProperty(k$4)||a.hasOwnProperty(k$4);
             return!eqR[0];
            }(k$3))
             break;
           }
          return eqR[0];
         }
    }
    else
     return m=="function"&&("$Func"in a?a.$Func===b.$Func&&a.$Target===b.$Target:"$Invokes"in a&&"$Invokes"in b&&Unchecked.arrayEquals(a.$Invokes,b.$Invokes));
   }
 };
 Unchecked.arrayEquals=function(a,b)
 {
  var eq,i;
  if(Arrays.length(a)===Arrays.length(b))
   {
    eq=true;
    i=0;
    while(eq&&i<Arrays.length(a))
     {
      !Unchecked.Equals(Arrays.get(a,i),Arrays.get(b,i))?eq=false:void 0;
      i=i+1;
     }
    return eq;
   }
  else
   return false;
 };
 Unchecked.dateEquals=function(a,b)
 {
  return a.getTime()===b.getTime();
 };
 Unchecked.Hash=function(o)
 {
  var m;
  m=typeof o;
  return m=="function"?0:m=="boolean"?o?1:0:m=="number"?o:m=="string"?Unchecked.hashString(o):m=="object"?o==null?0:o instanceof Global.Array?Unchecked.hashArray(o):Unchecked.hashObject(o):0;
 };
 Unchecked.hashString=function(s)
 {
  var hash,i,$1;
  if(s===null)
   return 0;
  else
   {
    hash=5381;
    for(i=0,$1=s.length-1;i<=$1;i++)hash=Unchecked.hashMix(hash,s[i].charCodeAt());
    return hash;
   }
 };
 Unchecked.hashArray=function(o)
 {
  var h,i,$1;
  h=-34948909;
  for(i=0,$1=Arrays.length(o)-1;i<=$1;i++)h=Unchecked.hashMix(h,Unchecked.Hash(Arrays.get(o,i)));
  return h;
 };
 Unchecked.hashObject=function(o)
 {
  var h,k;
  if("GetHashCode"in o)
   return o.GetHashCode();
  else
   {
    h=[0];
    for(var k$1 in o)if(function(key)
    {
     h[0]=Unchecked.hashMix(Unchecked.hashMix(h[0],Unchecked.hashString(key)),Unchecked.Hash(o[key]));
     return false;
    }(k$1))
     break;
    return h[0];
   }
 };
 Unchecked.hashMix=function(x,y)
 {
  return(x<<5)+x+y;
 };
 SC$1.$cctor=function()
 {
  SC$1.$cctor=Global.ignore;
  SC$1.HtmlProvider=new JQueryHtmlProvider.New();
  SC$1.Attr=new AttributeBuilder.New(Implementation.HtmlProvider());
  SC$1.Tags=new TagBuilder.New(Implementation.HtmlProvider());
  SC$1.DeprecatedHtml=new DeprecatedTagBuilder.New(Implementation.HtmlProvider());
  SC$1.Tags$1=Implementation.Tags();
  SC$1.Deprecated=Implementation.DeprecatedHtml();
  SC$1.Attr$1=Implementation.Attr();
 };
 SC$2.$cctor=function()
 {
  SC$2.$cctor=Global.ignore;
  SC$2.RX=Reactive$1.Default();
  SC$2.Layout=new LayoutProvider.New(new LayoutUtils.New({
   Reactive:Reactive$1.Default()
  }));
  SC$2.DefaultLayout=Data.Layout().get_Vertical();
  SC$2.Validator=new Validator.New(new ValidatorProvidor.New());
  SC$2.Do=new FormletBuilder.New();
 };
 FormletProvider=Base.FormletProvider=Runtime.Class({
  Delay:function(f)
  {
   var $this;
   $this=this;
   return Formlet$2.New(this.L.Delay(function()
   {
    return f().LayoutI();
   }),function()
   {
    return $this.BuildForm(f());
   },this.U);
  },
  Bind:function(formlet,f)
  {
   var $this;
   $this=this;
   return $this.Join($this.Map(f,formlet));
  },
  Return:function(x)
  {
   var $this;
   $this=this;
   return $this.New(function()
   {
    return Form.New($this.U.Reactive.Never(),Global.ignore,Global.ignore,$this.U.Reactive.Return({
     $:0,
     $0:x
    }));
   });
  },
  BuildForm:function(formlet)
  {
   var form,m,d;
   form=formlet.BuildI();
   m=formlet.LayoutI().Apply(form.Body);
   return m!=null&&m.$==1?(d=m.$0[1],Form.New(this.U.Reactive.Return(Tree.Set(m.$0[0])),function()
   {
    form.Dispose$1();
    d.Dispose();
   },form.Notify,form.State)):form;
  },
  Map:function(f,formlet)
  {
   return this.MapResult(function(a)
   {
    return Result.Map(f,a);
   },formlet);
  },
  Join:function(formlet)
  {
   var $this;
   $this=this;
   return $this.New(function()
   {
    var form1,formStream,a;
    form1=$this.BuildForm(formlet);
    formStream=$this.U.Reactive.Heat($this.U.Reactive.Select(form1.State,function(res)
    {
     return res.$==1?$this.Fail(res.$0):$this.BuildForm(res.$0);
    }));
    return Form.New((a=$this.U.Reactive.Select($this.U.Reactive.Switch($this.U.Reactive.Select(formStream,function(f)
    {
     return $this.U.Reactive.Concat($this.U.Reactive.Return(Tree.Delete()),f.Body);
    })),function(a$1)
    {
     return new Edit({
      $:2,
      $0:a$1
     });
    }),$this.U.Reactive.Merge($this.U.Reactive.Select(form1.Body,function(a$1)
    {
     return new Edit({
      $:1,
      $0:a$1
     });
    }),a)),function()
    {
     form1.Dispose$1();
    },function(o)
    {
     form1.Notify(o);
    },$this.U.Reactive.Switch($this.U.Reactive.Select(formStream,function(f)
    {
     return f.State;
    })));
   });
  },
  New:function(build)
  {
   return Formlet$2.New(this.L.Default(),build,this.U);
  },
  MapResult:function(f,formlet)
  {
   var $this;
   $this=this;
   return Formlet$2.New(formlet.LayoutI(),function()
   {
    var form;
    form=formlet.BuildI();
    return Form.New(form.Body,form.Dispose$1,form.Notify,$this.U.Reactive.Select(form.State,f));
   },this.U);
  },
  Fail:function(fs)
  {
   return Form.New(this.U.Reactive.Never(),Global.ignore,Global.ignore,this.U.Reactive.Return({
    $:1,
    $0:fs
   }));
  },
  ApplyLayout:function(formlet)
  {
   var $this;
   $this=this;
   return $this.New(function()
   {
    var form,m;
    form=formlet.BuildI();
    return Form.New((m=formlet.LayoutI().Apply(form.Body),m==null?form.Body:$this.U.Reactive.Return(Tree.Set(m.$0[0]))),form.Dispose$1,form.Notify,form.State);
   });
  },
  MapBody:function(f,formlet)
  {
   var $this;
   $this=this;
   return this.WithLayout({
    Apply:function(o)
    {
     var m,m$1;
     m=formlet.LayoutI().Apply(o);
     return m==null?(m$1=$this.U.DefaultLayout.Apply(o),m$1==null?null:{
      $:1,
      $0:[f(m$1.$0[0]),m$1.$0[1]]
     }):{
      $:1,
      $0:[f(m.$0[0]),m.$0[1]]
     };
    }
   },formlet);
  },
  Apply:function(f,x)
  {
   var $this;
   $this=this;
   return $this.New(function()
   {
    var f$1,x$1;
    function a(r,f$2)
    {
     return Result.Apply(f$2,r);
    }
    f$1=$this.BuildForm(f);
    x$1=$this.BuildForm(x);
    return Form.New($this.U.Reactive.Merge($this.U.Reactive.Select(f$1.Body,function(a$1)
    {
     return new Edit({
      $:1,
      $0:a$1
     });
    }),$this.U.Reactive.Select(x$1.Body,function(a$1)
    {
     return new Edit({
      $:2,
      $0:a$1
     });
    })),function()
    {
     x$1.Dispose$1();
     f$1.Dispose$1();
    },function(o)
    {
     x$1.Notify(o);
     f$1.Notify(o);
    },$this.U.Reactive.CombineLatest(x$1.State,f$1.State,function($1)
    {
     return function($2)
     {
      return a($1,$2);
     };
    }));
   });
  },
  WithLayout:function(layout,formlet)
  {
   return Formlet$2.New(layout,function()
   {
    return formlet.BuildI();
   },this.U);
  },
  LiftResult:function(formlet)
  {
   return this.MapResult(function(a)
   {
    return{
     $:0,
     $0:a
    };
   },formlet);
  },
  InitWithFailure:function(formlet)
  {
   var $this,x;
   $this=this;
   x=$this.New(function()
   {
    var form;
    form=formlet.BuildI();
    return Form.New(form.Body,form.Dispose$1,form.Notify,$this.U.Reactive.Concat($this.U.Reactive.Return({
     $:1,
     $0:T.Empty
    }),form.State));
   });
   return $this.WithLayout(formlet.LayoutI(),x);
  },
  WithNotificationChannel:function(formlet)
  {
   var $this,x;
   $this=this;
   x=$this.New(function()
   {
    var form;
    function a(v)
    {
     return[v,form.Notify];
    }
    form=formlet.BuildI();
    return Form.New(form.Body,form.Dispose$1,form.Notify,$this.U.Reactive.Select(form.State,function(a$1)
    {
     return Result.Map(a,a$1);
    }));
   });
   return $this.WithLayout(formlet.LayoutI(),x);
  }
 },Obj,FormletProvider);
 FormletProvider.New=Runtime.Ctor(function(U)
 {
  Obj.New.call(this);
  this.U=U;
  this.L=new LayoutUtils.New({
   Reactive:this.U.Reactive
  });
 },FormletProvider);
 Data.BaseFormlet=function()
 {
  return new FormletProvider.New(Data.UtilsProvider());
 };
 Data.OfIFormlet=function(formlet)
 {
  return Data.PropagateRenderFrom(formlet,new Formlet$3.New(function()
  {
   return formlet.BuildI();
  },formlet.LayoutI(),Data.BaseFormlet(),Data.UtilsProvider()));
 };
 Data.PropagateRenderFrom=function(f1,f2)
 {
  f1.hasOwnProperty("Render")?f2.Render=f1.Render:void 0;
  return f2;
 };
 Data.Layout=function()
 {
  SC$2.$cctor();
  return SC$2.Layout;
 };
 Data.UtilsProvider=function()
 {
  return{
   Reactive:Data.RX(),
   DefaultLayout:Data.DefaultLayout()
  };
 };
 Data.$=function(f,x)
 {
  return Data.OfIFormlet(Data.BaseFormlet().Apply(f,x));
 };
 Data.RX=function()
 {
  SC$2.$cctor();
  return SC$2.RX;
 };
 Data.DefaultLayout=function()
 {
  SC$2.$cctor();
  return SC$2.DefaultLayout;
 };
 Data.MkFormlet=function(f)
 {
  return Data.OfIFormlet(Data.BaseFormlet().New(function()
  {
   var p,reset,a;
   p=f();
   reset=p[1];
   return Form.New((a=Tree.Set(Data.NewBody(p[0],null)),Data.RX().Return(a)),Global.ignore,function()
   {
    reset();
   },p[2]);
  }));
 };
 Data.NewBody=function(a,a$1)
 {
  return Body.New$1(a,a$1);
 };
 FormContainerConfiguration.get_Default=function()
 {
  return FormContainerConfiguration.New(null,Padding.get_Default(),null,null,null,null,null);
 };
 FormContainerConfiguration.New=function(Header,Padding$2,Description,BackgroundColor,BorderColor,CssClass,Style)
 {
  return{
   Header:Header,
   Padding:Padding$2,
   Description:Description,
   BackgroundColor:BackgroundColor,
   BorderColor:BorderColor,
   CssClass:CssClass,
   Style:Style
  };
 };
 HtmlEditorConfiguration.get_Default=function()
 {
  return HtmlEditorConfiguration.New({
   $:0
  },null,null,null,null,null,null,null);
 };
 HtmlEditorConfiguration.New=function(Theme,Width,Height,Plugins,AdvancedToolbarLocation,AdvancedToolbarAlign,AdvancedStatusbarLocation,AdvancedButtons)
 {
  return{
   Theme:Theme,
   Width:Width,
   Height:Height,
   Plugins:Plugins,
   AdvancedToolbarLocation:AdvancedToolbarLocation,
   AdvancedToolbarAlign:AdvancedToolbarAlign,
   AdvancedStatusbarLocation:AdvancedStatusbarLocation,
   AdvancedButtons:AdvancedButtons
  };
 };
 FormButtonConfiguration.get_Default=function()
 {
  return FormButtonConfiguration.New(null,null,null);
 };
 FormButtonConfiguration.New=function(Label,Style,Class)
 {
  return{
   Label:Label,
   Style:Style,
   Class:Class
  };
 };
 Arrays.get=function(arr,n)
 {
  Arrays.checkBounds(arr,n);
  return arr[n];
 };
 Arrays.length=function(arr)
 {
  return arr.dims===2?arr.length*arr.length:arr.length;
 };
 Arrays.checkBounds=function(arr,n)
 {
  if(n<0||n>=arr.length)
   Operators.FailWith("Index was outside the bounds of the array.");
 };
 Pervasives.NewFromSeq=function(fields)
 {
  var r,e,f;
  r={};
  e=Enumerator.Get(fields);
  try
  {
   while(e.MoveNext())
    {
     f=e.Current();
     r[f[0]]=f[1];
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return r;
 };
 Element=Client.Element=Runtime.Class({
  AppendI:function(pl)
  {
   var body,r;
   body=pl.get_Body();
   body.nodeType===2?this.HtmlProvider.AppendAttribute(this.get_Body(),body):this.HtmlProvider.AppendNode(this.get_Body(),pl.get_Body());
   this.IsRendered?pl.Render():(r=this.RenderInternal,this.RenderInternal=function()
   {
    r();
    pl.Render();
   });
  },
  get_Value:function()
  {
   return this.HtmlProvider.GetValue(this.get_Body());
  },
  set_Value:function(x)
  {
   this.HtmlProvider.SetValue(this.get_Body(),x);
  },
  get_Body:function()
  {
   return this.Dom;
  },
  Render:function()
  {
   if(!this.IsRendered)
    {
     this.RenderInternal();
     this.IsRendered=true;
    }
  },
  get_Id:function()
  {
   var id,newId;
   id=this.HtmlProvider.GetProperty(this.get_Body(),"id");
   return id===void 0||id===""?(newId="id"+Math.round(Math.random()*100000000),(this.HtmlProvider.SetProperty(this.get_Body(),"id",newId),newId)):id;
  }
 },Pagelet,Element);
 Element.New=function(html,name)
 {
  var el,dom;
  el=new Element.New$1(html);
  dom=self.document.createElement(name);
  el.RenderInternal=Global.ignore;
  el.Dom=dom;
  el.IsRendered=false;
  return el;
 };
 Element.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Element);
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Runtime.Class({
  AppendAttribute:function(node,attr)
  {
   this.SetAttribute(node,attr.nodeName,attr.value);
  },
  AppendNode:function(node,el)
  {
   var _this,a;
   _this=Global.jQuery(node);
   a=Global.jQuery(el);
   _this.append.apply(_this,[a]);
  },
  GetValue:function(node)
  {
   return Global.jQuery(node).val();
  },
  SetStyle:function(node,style)
  {
   Global.jQuery(node).attr("style",style);
  },
  SetCss:function(node,name,prop)
  {
   Global.jQuery(node).css(name,prop);
  },
  AddClass:function(node,cls)
  {
   Global.jQuery(node).addClass(cls);
  },
  SetValue:function(node,value)
  {
   Global.jQuery(node).val(value);
  },
  SetAttribute:function(node,name,value)
  {
   Global.jQuery(node).attr(name,value);
  },
  CreateAttribute:function(str)
  {
   return self.document.createAttribute(str);
  },
  GetProperty:function(node,name)
  {
   return Global.jQuery(node).prop(name);
  },
  SetProperty:function(node,name,value)
  {
   Global.jQuery(node).prop(name,value);
  },
  Remove:function(node)
  {
   Global.jQuery(node).remove();
  }
 },Obj,JQueryHtmlProvider);
 JQueryHtmlProvider.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },JQueryHtmlProvider);
 Implementation.HtmlProvider=function()
 {
  SC$1.$cctor();
  return SC$1.HtmlProvider;
 };
 Implementation.Tags=function()
 {
  SC$1.$cctor();
  return SC$1.Tags;
 };
 Implementation.DeprecatedHtml=function()
 {
  SC$1.$cctor();
  return SC$1.DeprecatedHtml;
 };
 Implementation.Attr=function()
 {
  SC$1.$cctor();
  return SC$1.Attr;
 };
 DeprecatedTagBuilder=Client.DeprecatedTagBuilder=Runtime.Class({},Obj,DeprecatedTagBuilder);
 DeprecatedTagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },DeprecatedTagBuilder);
 Text=Client.Text=Runtime.Class({
  get_Body:function()
  {
   return self.document.createTextNode(this.text);
  }
 },Pagelet,Text);
 Text.New=Runtime.Ctor(function(text)
 {
  Pagelet.New.call(this);
  this.text=text;
 },Text);
 Reactive$1.Default=function()
 {
  SC$4.$cctor();
  return SC$4.Default;
 };
 Reactive$1.Never=function()
 {
  return{
   Subscribe:function()
   {
    return Disposable.New(Global.ignore);
   }
  };
 };
 Reactive$1.Return=function(x)
 {
  return{
   Subscribe:function(o)
   {
    o.OnNext(x);
    o.OnCompleted();
    return Disposable.New(Global.ignore);
   }
  };
 };
 Reactive$1.Select=function(io,f)
 {
  return{
   Subscribe:function(o1)
   {
    return io.Subscribe(Util.observer(function(v)
    {
     o1.OnNext(f(v));
    }));
   }
  };
 };
 Reactive$1.Heat=function(io)
 {
  var s;
  s=HotStream.New$2();
  io.Subscribe(Util.observer(function(a)
  {
   s.Trigger(a);
  }));
  return s;
 };
 Reactive$1.Switch=function(io)
 {
  return{
   Subscribe:function(o)
   {
    var index,disp;
    index=[0];
    disp=[null];
    return io.Subscribe(Util.observer(function(o1)
    {
     var currentIndex;
     index[0]++;
     disp[0]!=null?disp[0].$0.Dispose():void 0;
     currentIndex=index[0];
     disp[0]={
      $:1,
      $0:o1.Subscribe(Util.observer(function(v)
      {
       if(currentIndex===index[0])
        o.OnNext(v);
      }))
     };
    }));
   }
  };
 };
 Reactive$1.Merge=function(io1,io2)
 {
  return{
   Subscribe:function(o)
   {
    var completed1,completed2,disp1,disp2;
    completed1=[false];
    completed2=[false];
    disp1=io1.Subscribe(Observer.New(function(a)
    {
     o.OnNext(a);
    },function()
    {
     completed1[0]=true;
     completed1[0]&&completed2[0]?o.OnCompleted():void 0;
    }));
    disp2=io2.Subscribe(Observer.New(function(a)
    {
     o.OnNext(a);
    },function()
    {
     completed2[0]=true;
     completed1[0]&&completed2[0]?o.OnCompleted():void 0;
    }));
    return Disposable.New(function()
    {
     disp1.Dispose();
     disp2.Dispose();
    });
   }
  };
 };
 Reactive$1.Concat=function(io1,io2)
 {
  return{
   Subscribe:function(o)
   {
    var innerDisp,outerDisp;
    innerDisp=[null];
    outerDisp=io1.Subscribe(Observer.New(function(a)
    {
     o.OnNext(a);
    },function()
    {
     innerDisp[0]={
      $:1,
      $0:io2.Subscribe(o)
     };
    }));
    return Disposable.New(function()
    {
     innerDisp[0]!=null?innerDisp[0].$0.Dispose():void 0;
     outerDisp.Dispose();
    });
   }
  };
 };
 Reactive$1.CombineLatest=function(io1,io2,f)
 {
  return{
   Subscribe:function(o)
   {
    var lv1,lv2,d1,d2;
    function update()
    {
     var $1,$2;
     $1=lv1[0];
     $2=lv2[0];
     $1!=null&&$1.$==1?$2!=null&&$2.$==1?o.OnNext(f($1.$0,$2.$0)):void 0:void 0;
    }
    lv1=[null];
    lv2=[null];
    d1=io1.Subscribe(Observer.New(function(x)
    {
     lv1[0]={
      $:1,
      $0:x
     };
     update();
    },Global.ignore));
    d2=io2.Subscribe(Observer.New(function(y)
    {
     lv2[0]={
      $:1,
      $0:y
     };
     update();
    },Global.ignore));
    return Disposable.New(function()
    {
     d1.Dispose();
     d2.Dispose();
    });
   }
  };
 };
 LayoutProvider=Formlets.LayoutProvider=Runtime.Class({
  get_Vertical:function()
  {
   return this.RowLayout(FormRowConfiguration.get_Default());
  },
  get_Horizontal:function()
  {
   return this.ColumnLayout(FormRowConfiguration.get_Default());
  },
  RowLayout:function(rowConfig)
  {
   var $this;
   $this=this;
   return this.LayoutUtils.New(function()
   {
    var panel,container,store;
    function insert(rowIx,body)
    {
     var elemId,row,jqPanel,index,inserted;
     elemId=body.Element.get_Id();
     row=$this.MakeRow(rowConfig,rowIx,body);
     jqPanel=Global.jQuery(panel.get_Body());
     index=[0];
     inserted=[false];
     jqPanel.children().each(function($1,$2)
     {
      var jqRow;
      jqRow=Global.jQuery($2);
      rowIx===index[0]?(Global.jQuery(row.get_Body()).insertBefore(jqRow),row.Render(),inserted[0]=true):void 0;
      index[0]++;
     });
     !inserted[0]?panel.AppendI(row):void 0;
     return store.RegisterElement(elemId,function()
     {
      row.HtmlProvider.Remove(row.get_Body());
     });
    }
    panel=Tags.Tags().NewTag("tbody",[]);
    container=Tags.Tags().NewTag("table",[panel]);
    store=ElementStore.NewElementStore();
    return{
     Body:Body.New(container,null),
     SyncRoot:null,
     Insert:function($1)
     {
      return function($2)
      {
       return insert($1,$2);
      };
     },
     Remove:function(elems)
     {
      var e;
      e=Enumerator.Get(elems);
      try
      {
       while(e.MoveNext())
        store.Remove(e.Current().Element.get_Id());
      }
      finally
      {
       if(typeof e=="object"&&"Dispose"in e)
        e.Dispose();
      }
     }
    };
   });
  },
  ColumnLayout:function(rowConfig)
  {
   var $this;
   $this=this;
   return this.LayoutUtils.New(function()
   {
    var row,container,a,store;
    function insert(rowIx,body)
    {
     var elemId,newCol,a$1,a$2,a$3,jqPanel,index,inserted;
     elemId=body.Element.get_Id();
     newCol=(a$1=[(a$2=[(a$3=[$this.MakeRow(rowConfig,rowIx,body)],Tags.Tags().NewTag("tbody",a$3))],Tags.Tags().NewTag("table",a$2))],Tags.Tags().NewTag("td",a$1));
     jqPanel=Global.jQuery(row.get_Body());
     index=[0];
     inserted=[false];
     jqPanel.children().each(function($1,$2)
     {
      var jqCol;
      jqCol=Global.jQuery($2);
      rowIx===index[0]?(Global.jQuery(newCol.get_Body()).insertBefore(jqCol),newCol.Render(),inserted[0]=true):void 0;
      index[0]++;
     });
     !inserted[0]?row.AppendI(newCol):void 0;
     return store.RegisterElement(elemId,function()
     {
      newCol.HtmlProvider.Remove(newCol.get_Body());
     });
    }
    row=Tags.Tags().NewTag("tr",[]);
    container=(a=[Tags.Tags().NewTag("tbody",[row])],Tags.Tags().NewTag("table",a));
    store=ElementStore.NewElementStore();
    return{
     Body:Body.New(container,null),
     SyncRoot:null,
     Insert:function($1)
     {
      return function($2)
      {
       return insert($1,$2);
      };
     },
     Remove:function(elems)
     {
      var e;
      e=Enumerator.Get(elems);
      try
      {
       while(e.MoveNext())
        store.Remove(e.Current().Element.get_Id());
      }
      finally
      {
       if(typeof e=="object"&&"Dispose"in e)
        e.Dispose();
      }
     }
    };
   });
  },
  MakeRow:function(rowConfig,rowIndex,body)
  {
   var padding,paddingLeft,paddingTop,paddingRight,paddingBottom,elem,cells,m,labelConf,label,m$1,rowClass,rowStyle,m$2,a,x;
   function makeCell(l,t,r,b,csp,valign,elem$1)
   {
    var paddingStyle,valignStyle,x$1;
    function m$3(k,v)
    {
     return k+Global.String(v)+"px;";
    }
    paddingStyle=Seq.reduce(function(x$2,y)
    {
     return x$2+y;
    },List.map(function($1)
    {
     return m$3($1[0],$1[1]);
    },List.ofArray([["padding-left: ",l],["padding-top: ",t],["padding-right: ",r],["padding-bottom: ",b]])));
    valignStyle=Utils.Maybe("",function(valign$1)
    {
     return"vertical-align: "+(valign$1.$==1?"middle":valign$1.$==2?"bottom":"top")+";";
    },valign);
    x$1=List.append(new T({
     $:1,
     $0:Attr.Attr().NewAttr("style",paddingStyle+";"+valignStyle),
     $1:csp?List.ofArray([Attr.Attr().NewAttr("colspan","2")]):T.Empty
    }),List.ofArray([elem$1]));
    return Tags.Tags().NewTag("td",x$1);
   }
   padding=Utils.Maybe(Padding$1.get_Default(),Global.id,rowConfig.Padding);
   paddingLeft=Utils.Maybe(0,Global.id,padding.Left);
   paddingTop=Utils.Maybe(0,Global.id,padding.Top);
   paddingRight=Utils.Maybe(0,Global.id,padding.Right);
   paddingBottom=Utils.Maybe(0,Global.id,padding.Bottom);
   elem=body.Element;
   cells=(m=body.Label,m!=null&&m.$==1?(labelConf=Utils.Maybe(LabelConfiguration.get_Default(),Global.id,rowConfig.LabelConfiguration),(label=this.HorizontalAlignElem(labelConf.Align,m.$0()),(m$1=labelConf.Placement,m$1.$==3?List.ofArray([makeCell(paddingLeft,paddingTop,paddingRight,paddingBottom,true,null,Utils.InTable(List.ofArray([List.ofArray([elem]),List.ofArray([label])])))]):m$1.$==0?List.ofArray([makeCell(paddingLeft,paddingTop,0,paddingBottom,false,{
    $:1,
    $0:labelConf.VerticalAlign
   },label),makeCell(0,paddingTop,paddingRight,paddingBottom,false,null,elem)]):m$1.$==1?List.ofArray([makeCell(paddingLeft,paddingTop,0,paddingBottom,false,{
    $:1,
    $0:labelConf.VerticalAlign
   },elem),makeCell(0,paddingTop,paddingRight,paddingBottom,false,null,label)]):List.ofArray([makeCell(paddingLeft,paddingTop,paddingRight,paddingBottom,true,null,Utils.InTable(List.ofArray([List.ofArray([label]),List.ofArray([elem])])))])))):List.ofArray([makeCell(paddingLeft,paddingTop,paddingRight,paddingBottom,true,null,elem)]));
   rowClass=Utils.Maybe(T.Empty,function(classGen)
   {
    var a$1;
    return List.ofArray([(a$1=classGen(rowIndex),Attr.Attr().NewAttr("class",a$1))]);
   },rowConfig.Class);
   rowStyle=(m$2=List.append(Utils.Maybe(T.Empty,function(colGen)
   {
    return List.ofArray(["background-color: "+colGen(rowIndex)]);
   },rowConfig.Color),Utils.Maybe(T.Empty,function(styleGen)
   {
    return List.ofArray([styleGen(rowIndex)]);
   },rowConfig.Style)),m$2.$==0?T.Empty:List.ofArray([(a=Seq.reduce(function($1,$2)
   {
    return $1+";"+$2;
   },m$2),Attr.Attr().NewAttr("style",a))]));
   x=List.append(rowClass,List.append(rowStyle,List.append(rowStyle,cells)));
   return Tags.Tags().NewTag("tr",x);
  },
  HorizontalAlignElem:function(align,el)
  {
   var a;
   return Operators$1.add((a=[Attr.Attr().NewAttr("style","float:"+(align.$==0?"left":"right")+";")],Tags.Tags().NewTag("div",a)),[el]);
  }
 },Obj,LayoutProvider);
 LayoutProvider.New=Runtime.Ctor(function(LayoutUtils$1)
 {
  Obj.New.call(this);
  this.LayoutUtils=LayoutUtils$1;
 },LayoutProvider);
 LayoutUtils=Base.LayoutUtils=Runtime.Class({
  Delay:function(f)
  {
   return{
    Apply:function(x)
    {
     return f().Apply(x);
    }
   };
  },
  Default:function()
  {
   return{
    Apply:function()
    {
     return null;
    }
   };
  },
  New:function(container)
  {
   return{
    Apply:function(event)
    {
     var panel,tree;
     panel=container();
     tree=[Tree$1.Empty];
     return{
      $:1,
      $0:[panel.Body,event.Subscribe(Util.observer(function(edit)
      {
       var deletedTree,off;
       deletedTree=Tree.ReplacedTree(edit,tree[0]);
       tree[0]=Tree.Apply(edit,tree[0]);
       off=(Tree.Range(edit,tree[0]))[0];
       panel.Remove(deletedTree.get_Sequence());
       Seq.iteri(function(i,e)
       {
        return(panel.Insert(off+i))(e);
       },edit);
      }))]
     };
    }
   };
  }
 },Obj,LayoutUtils);
 LayoutUtils.New=Runtime.Ctor(function(R)
 {
  Obj.New.call(this);
 },LayoutUtils);
 Validator=Base.Validator=Runtime.Class({},Obj,Validator);
 Validator.New=Runtime.Ctor(function(VP)
 {
  Obj.New.call(this);
  this.VP=VP;
 },Validator);
 ValidatorProvidor=Data.ValidatorProvidor=Runtime.Class({},Obj,ValidatorProvidor);
 ValidatorProvidor.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },ValidatorProvidor);
 Formlet$2=Base.Formlet=Runtime.Class({
  LayoutI:function()
  {
   return this.Layout;
  },
  BuildI:function()
  {
   return this.Build();
  }
 },null,Formlet$2);
 Formlet$2.New=function(Layout$1,Build,Utils$2)
 {
  return new Formlet$2({
   Layout:Layout$1,
   Build:Build,
   Utils:Utils$2
  });
 };
 Formlet$3=Data.Formlet=Runtime.Class({
  get_Body:function()
  {
   return this.Run(Global.ignore).get_Body();
  },
  Render:function()
  {
   this.Run(Global.ignore).Render();
  },
  Run:function(f)
  {
   var m,formlet,form,el,m$1;
   m=this.get_ElementInternal();
   return m==null?(formlet=this.formletBase.ApplyLayout(this),(form=formlet.BuildI(),(form.State.Subscribe(Util.observer(function(res)
   {
    Result.Map(f,res);
   })),el=(m$1=formlet.LayoutI().Apply(form.Body),m$1==null?Data.DefaultLayout().Apply(form.Body).$0[0].Element:m$1.$0[0].Element),this.set_ElementInternal({
    $:1,
    $0:el
   }),el))):m.$0;
  },
  get_ElementInternal:function()
  {
   return this.ElementInternal;
  },
  set_ElementInternal:function(v)
  {
   this.ElementInternal=v;
  },
  LayoutI:function()
  {
   return this.layoutInternal;
  },
  BuildI:function()
  {
   return this.buildInternal();
  }
 },Pagelet,Formlet$3);
 Formlet$3.New=Runtime.Ctor(function(buildInternal,layoutInternal,formletBase,utils)
 {
  Pagelet.New.call(this);
  this.buildInternal=buildInternal;
  this.layoutInternal=layoutInternal;
  this.formletBase=formletBase;
  this.utils=utils;
  this.ElementInternal=null;
 },Formlet$3);
 HotStream=Reactive.HotStream=Runtime.Class({
  Trigger:function(v)
  {
   this.Latest[0]={
    $:1,
    $0:v
   };
   this.Event.event.Trigger(v);
  },
  Subscribe:function(o)
  {
   this.Latest[0]!=null?o.OnNext(this.Latest[0].$0):void 0;
   return this.Event.event.Subscribe(o);
  }
 },null,HotStream);
 HotStream.New$1=function(x)
 {
  return HotStream.New([{
   $:1,
   $0:x
  }],new FSharpEvent.New());
 };
 HotStream.New$2=function()
 {
  return HotStream.New([null],new FSharpEvent.New());
 };
 HotStream.New=function(Latest,Event$2)
 {
  return new HotStream({
   Latest:Latest,
   Event:Event$2
  });
 };
 Form=Base.Form=Runtime.Class({
  Dispose:function()
  {
   this.Dispose$1();
  }
 },null,Form);
 Form.New=function(Body$1,Dispose,Notify,State)
 {
  return new Form({
   Body:Body$1,
   Dispose:Dispose,
   Notify:Notify,
   State:State
  });
 };
 Utils.Maybe=function(d,f,o)
 {
  return o==null?d:f(o.$0);
 };
 Utils.MapOption=function(f,value)
 {
  return value!=null&&value.$==1?{
   $:1,
   $0:f(value.$0)
  }:null;
 };
 Utils.InTable=function(rows)
 {
  var a,a$1;
  a=[(a$1=List.map(function(cols)
  {
   var a$2;
   a$2=List.map(function(c)
   {
    return Tags.Tags().NewTag("td",[c]);
   },cols);
   return Tags.Tags().NewTag("tr",a$2);
  },rows),Tags.Tags().NewTag("tbody",a$1))];
  return Tags.Tags().NewTag("table",a);
 };
 Padding.get_Default=function()
 {
  return Padding.New(null,null,null,null);
 };
 Padding.New=function(Left,Right,Top,Bottom)
 {
  return{
   Left:Left,
   Right:Right,
   Top:Top,
   Bottom:Bottom
  };
 };
 FSharpEvent=Control$1.FSharpEvent=Runtime.Class({},Obj,FSharpEvent);
 FSharpEvent.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.event=Event$1.New([]);
 },FSharpEvent);
 Utils$1.ShowTheme=function(theme)
 {
  return theme.$==1?"advanced":theme.$==2?theme.$0:"simple";
 };
 Utils$1.ShowButtonType=function(btype)
 {
  return btype.$==1?"italic":btype.$==2?"underline":btype.$==3?"strikethrough":btype.$==4?"justifyleft":btype.$==5?"justifycenter":btype.$==6?"justifyright":btype.$==7?"justifyfull":btype.$==8?"bullist":btype.$==9?"numlist":btype.$==10?"outdent":btype.$==11?"indent":btype.$==12?"cut":btype.$==13?"copy":btype.$==14?"paste":btype.$==15?"undo":btype.$==16?"redo":btype.$==17?"link":btype.$==18?"unlink":btype.$==19?"image":btype.$==20?"cleanup":btype.$==21?"help":btype.$==22?"code":btype.$==23?"hr":btype.$==24?"removeformat":btype.$==25?"formatselect":btype.$==26?"fontselect":btype.$==27?"fontselect":btype.$==28?"styleselect":btype.$==29?"sub":btype.$==30?"sup":btype.$==31?"forecolor":btype.$==32?"backcolor":btype.$==33?"forecolorpicker":btype.$==34?"backcolorpicker":btype.$==35?"charmap":btype.$==36?"visualaid":btype.$==37?"anchor":btype.$==38?"newdocument":btype.$==39?"blackquote":btype.$==40?"separator":btype.$==41?btype.$0:"bold";
 };
 Seq.map=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var en;
    en=Enumerator.Get(s);
    return new T$1.New(null,null,function(e)
    {
     return en.MoveNext()&&(e.c=f(en.Current()),true);
    },function()
    {
     en.Dispose();
    });
   }
  };
 };
 Seq.reduce=function(f,source)
 {
  var e,r;
  e=Enumerator.Get(source);
  try
  {
   if(!e.MoveNext())
    Seq.seqEmpty();
   r=e.Current();
   while(e.MoveNext())
    r=f(r,e.Current());
   return r;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.seqEmpty=function()
 {
  return Operators.FailWith("The input sequence was empty.");
 };
 Seq.iteri=function(p,s)
 {
  var i,e;
  i=0;
  e=Enumerator.Get(s);
  try
  {
   while(e.MoveNext())
    {
     p(i,e.Current());
     i=i+1;
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.append=function(s1,s2)
 {
  return{
   GetEnumerator:function()
   {
    var e1,first;
    e1=Enumerator.Get(s1);
    first=[true];
    return new T$1.New(e1,null,function(x)
    {
     var x$1;
     return x.s.MoveNext()?(x.c=x.s.Current(),true):(x$1=x.s,!Unchecked.Equals(x$1,null)?x$1.Dispose():void 0,x.s=null,first[0]&&(first[0]=false,x.s=Enumerator.Get(s2),x.s.MoveNext()?(x.c=x.s.Current(),true):(x.s.Dispose(),x.s=null,false)));
    },function(x)
    {
     var x$1;
     x$1=x.s;
     !Unchecked.Equals(x$1,null)?x$1.Dispose():void 0;
    });
   }
  };
 };
 Seq.tryFindIndex=function(ok,s)
 {
  var e,loop,i;
  e=Enumerator.Get(s);
  try
  {
   loop=true;
   i=0;
   while(loop&&e.MoveNext())
    if(ok(e.Current()))
     loop=false;
    else
     i=i+1;
   return loop?null:{
    $:1,
    $0:i
   };
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Attribute=Client.Attribute=Runtime.Class({
  get_Body:function()
  {
   var attr;
   attr=this.HtmlProvider.CreateAttribute(this.Name);
   attr.value=this.Value;
   return attr;
  }
 },Pagelet,Attribute);
 Attribute.New=function(htmlProvider,name,value)
 {
  var a;
  a=new Attribute.New$1(htmlProvider);
  a.Name=name;
  a.Value=value;
  return a;
 };
 Attribute.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Attribute);
 SC$3.$cctor=function()
 {
  SC$3.$cctor=Global.ignore;
  SC$3.Events=new JQueryEventSupport.New();
 };
 Enumerator.Get=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):x.GetEnumerator();
 };
 Enumerator.ArrayEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<Arrays.length(s)&&(e.c=Arrays.get(s,i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.StringEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<s.length&&(e.c=s[i],e.s=i+1,true);
  },void 0);
 };
 Enumerator.Get0=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):"GetEnumerator0"in x?x.GetEnumerator0():x.GetEnumerator();
 };
 SC$4.$cctor=function()
 {
  SC$4.$cctor=Global.ignore;
  SC$4.Default=new Reactive$2.New();
 };
 FormRowConfiguration.get_Default=function()
 {
  return FormRowConfiguration.New(null,null,null,null,null);
 };
 FormRowConfiguration.New=function(Padding$2,Color,Class,Style,LabelConfiguration$1)
 {
  return{
   Padding:Padding$2,
   Color:Color,
   Class:Class,
   Style:Style,
   LabelConfiguration:LabelConfiguration$1
  };
 };
 Tree.Set=function(value)
 {
  return new Edit({
   $:0,
   $0:new Tree$1({
    $:1,
    $0:value
   })
  });
 };
 Tree.Delete=function()
 {
  return new Edit({
   $:0,
   $0:Tree$1.Empty
  });
 };
 Tree.Apply=function(edit,input)
 {
  function apply(edit$1,input$1)
  {
   return edit$1.$==1?input$1.$==2?new Tree$1({
    $:2,
    $0:apply(edit$1.$0,input$1.$0),
    $1:input$1.$1
   }):apply(new Edit({
    $:1,
    $0:edit$1.$0
   }),new Tree$1({
    $:2,
    $0:Tree$1.Empty,
    $1:input$1
   })):edit$1.$==2?input$1.$==2?new Tree$1({
    $:2,
    $0:input$1.$0,
    $1:apply(edit$1.$0,input$1.$1)
   }):apply(new Edit({
    $:2,
    $0:edit$1.$0
   }),new Tree$1({
    $:2,
    $0:input$1,
    $1:Tree$1.Empty
   })):edit$1.$0;
  }
  return apply(edit,input);
 };
 Tree.Range=function(edit,input)
 {
  var edit$1,input$1,offset,edit$2,l,edit$3,r,l$1,tree;
  edit$1=edit;
  input$1=input;
  offset=0;
  while(true)
   if(edit$1.$==1)
    {
     edit$2=edit$1.$0;
     if(input$1.$==2)
      {
       l=input$1.$0;
       edit$1=edit$2;
       input$1=l;
      }
     else
      {
       edit$1=edit$2;
       input$1=Tree$1.Empty;
      }
    }
   else
    if(edit$1.$==2)
     {
      edit$3=edit$1.$0;
      if(input$1.$==2)
       {
        r=input$1.$1;
        l$1=input$1.$0;
        edit$1=edit$3;
        input$1=r;
        offset=offset+Tree.Count(l$1);
       }
      else
       {
        tree=input$1;
        edit$1=edit$3;
        input$1=Tree$1.Empty;
        offset=offset+Tree.Count(tree);
       }
     }
    else
     return[offset,Tree.Count(input$1)];
 };
 Tree.ReplacedTree=function(edit,input)
 {
  var edit$1,l,tree,edit$2,r,tree$1;
  while(true)
   if(edit.$==1)
    {
     edit$1=edit.$0;
     if(input.$==2)
      {
       l=input.$0;
       edit=edit$1;
       input=l;
      }
     else
      {
       tree=input;
       edit=new Edit({
        $:1,
        $0:edit$1
       });
       input=new Tree$1({
        $:2,
        $0:Tree$1.Empty,
        $1:tree
       });
      }
    }
   else
    if(edit.$==2)
     {
      edit$2=edit.$0;
      if(input.$==2)
       {
        r=input.$1;
        edit=edit$2;
        input=r;
       }
      else
       {
        tree$1=input;
        edit=new Edit({
         $:2,
         $0:edit$2
        });
        input=new Tree$1({
         $:2,
         $0:tree$1,
         $1:Tree$1.Empty
        });
       }
     }
    else
     return input;
 };
 Tree.Count=function(t)
 {
  var n,t$1,a,b,a$1,tree,k,ts,t$2;
  n=0;
  t$1=T.Empty;
  a=t;
  while(true)
   if(a.$==2)
    {
     b=a.$1;
     a$1=a.$0;
     t$1=new T({
      $:1,
      $0:b,
      $1:t$1
     });
     a=a$1;
    }
   else
    {
     tree=a;
     k=tree.$==0?0:1;
     if(t$1.$==1)
      {
       ts=t$1.$1;
       t$2=t$1.$0;
       n=n+k;
       t$1=ts;
       a=t$2;
      }
     else
      return n+k;
    }
 };
 Result.Map=function(f,res)
 {
  return res.$==1?{
   $:1,
   $0:res.$0
  }:{
   $:0,
   $0:f(res.$0)
  };
 };
 Result.Apply=function(f,r)
 {
  return f.$==1?r.$==1?{
   $:1,
   $0:List.append(f.$0,r.$0)
  }:{
   $:1,
   $0:f.$0
  }:r.$==1?{
   $:1,
   $0:r.$0
  }:{
   $:0,
   $0:f.$0(r.$0)
  };
 };
 Edit=Tree.Edit=Runtime.Class({
  get_Sequence:function()
  {
   return this.$==1?this.$0.get_Sequence():this.$==2?this.$0.get_Sequence():this.$0.get_Sequence();
  },
  GetEnumerator:function()
  {
   return Enumerator.Get(this.get_Sequence());
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get(this.get_Sequence());
  }
 },null,Edit);
 Body.New$1=function(el,l)
 {
  return Body.New(el,l);
 };
 Body.New=function(Element$1,Label)
 {
  return{
   Element:Element$1,
   Label:Label
  };
 };
 Event$1=Event.Event=Runtime.Class({
  Trigger:function(x)
  {
   var a,i,$1;
   a=this.Handlers.slice();
   for(i=0,$1=a.length-1;i<=$1;i++)(Arrays.get(a,i))(null,x);
  },
  Subscribe$1:function(observer)
  {
   var $this;
   function h(a,x)
   {
    return observer.OnNext(x);
   }
   function dispose()
   {
    $this.RemoveHandler$1(h);
   }
   $this=this;
   this.AddHandler$1(h);
   return{
    Dispose:function()
    {
     return dispose();
    }
   };
  },
  AddHandler$1:function(h)
  {
   this.Handlers.push(h);
  },
  RemoveHandler$1:function(h)
  {
   var o,o$1;
   o=Seq.tryFindIndex(function(y)
   {
    return Unchecked.Equals(h,y);
   },this.Handlers);
   o==null?void 0:(o$1=this.Handlers,o$1.splice.apply(o$1,[o.$0,1]));
  },
  Dispose:Global.ignore,
  Subscribe:function(observer)
  {
   return this.Subscribe$1(observer);
  }
 },null,Event$1);
 Event$1.New=function(Handlers)
 {
  return new Event$1({
   Handlers:Handlers
  });
 };
 T$1=Enumerator.T=Runtime.Class({
  MoveNext:function()
  {
   return this.n(this);
  },
  Current:function()
  {
   return this.c;
  },
  Dispose:function()
  {
   if(this.d)
    this.d(this);
  }
 },Obj,T$1);
 T$1.New=Runtime.Ctor(function(s,c,n,d)
 {
  Obj.New.call(this);
  this.s=s;
  this.c=c;
  this.n=n;
  this.d=d;
 },T$1);
 Arrays.exists=function(f,x)
 {
  var e,i,$1,l;
  e=false;
  i=0;
  l=Arrays.length(x);
  while(!e&&i<l)
   if(f(x[i]))
    e=true;
   else
    i=i+1;
  return e;
 };
 Arrays.pick=function(f,arr)
 {
  var m;
  m=Arrays.tryPick(f,arr);
  return m==null?Operators.FailWith("KeyNotFoundException"):m.$0;
 };
 Arrays.filter=function(f,arr)
 {
  var r,i,$1;
  r=[];
  for(i=0,$1=arr.length-1;i<=$1;i++)if(f(arr[i]))
   r.push(arr[i]);
  return r;
 };
 Arrays.tryFindIndex=function(f,arr)
 {
  var res,i;
  res=null;
  i=0;
  while(i<arr.length&&res==null)
   {
    f(arr[i])?res={
     $:1,
     $0:i
    }:void 0;
    i=i+1;
   }
  return res;
 };
 Arrays.tryPick=function(f,arr)
 {
  var res,i,m;
  res=null;
  i=0;
  while(i<arr.length&&res==null)
   {
    m=f(arr[i]);
    m!=null&&m.$==1?res=m:void 0;
    i=i+1;
   }
  return res;
 };
 Arrays.concat=function(xs)
 {
  return Global.Array.prototype.concat.apply([],Arrays.ofSeq(xs));
 };
 Arrays.ofSeq=function(xs)
 {
  var q,o;
  if(xs instanceof Global.Array)
   return xs.slice();
  else
   if(xs instanceof T)
    return Arrays.ofList(xs);
   else
    {
     q=[];
     o=Enumerator.Get(xs);
     try
     {
      while(o.MoveNext())
       q.push(o.Current());
      return q;
     }
     finally
     {
      if(typeof o=="object"&&"Dispose"in o)
       o.Dispose();
     }
    }
 };
 Arrays.ofList=function(xs)
 {
  var l,q;
  q=[];
  l=xs;
  while(!(l.$==0))
   {
    q.push(List.head(l));
    l=List.tail(l);
   }
  return q;
 };
 JQueryEventSupport=Events.JQueryEventSupport=Runtime.Class({
  OnMouse:function(name,f,el)
  {
   Global.jQuery(el.get_Body()).on(name,function(ev)
   {
    return f(el,{
     X:ev.pageX,
     Y:ev.pageY,
     Event:ev
    });
   });
  },
  OnClick:function(f,el)
  {
   this.OnMouse("click",function($1,$2)
   {
    return(f($1))($2);
   },el);
  },
  OnChange:function(f,el)
  {
   Global.jQuery(el.get_Body()).on("change",function(ev)
   {
    return(f(el))(ev);
   });
  },
  OnKeyUp:function(f,el)
  {
   Global.jQuery(el.get_Body()).on("keyup",function(ev)
   {
    return(f(el))({
     KeyCode:ev.keyCode,
     Event:ev
    });
   });
  }
 },Obj,JQueryEventSupport);
 JQueryEventSupport.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },JQueryEventSupport);
 Reactive$2=Reactive$1.Reactive=Runtime.Class({
  Never:function()
  {
   return Reactive$1.Never();
  },
  Return:function(x)
  {
   return Reactive$1.Return(x);
  },
  Select:function(io,f)
  {
   return Reactive$1.Select(io,f);
  },
  Heat:function(io)
  {
   return Reactive$1.Heat(io);
  },
  Switch:function(io)
  {
   return Reactive$1.Switch(io);
  },
  Merge:function(io1,io2)
  {
   return Reactive$1.Merge(io1,io2);
  },
  Concat:function(io1,io2)
  {
   return Reactive$1.Concat(io1,io2);
  },
  CombineLatest:function(io1,io2,f)
  {
   return Reactive$1.CombineLatest(io1,io2,function($1,$2)
   {
    return(f($1))($2);
   });
  }
 },Obj,Reactive$2);
 Reactive$2.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },Reactive$2);
 ElementStore=Formlets.ElementStore=Runtime.Class({
  Remove:function(key)
  {
   if(this.store.ContainsKey(key))
    {
     (this.store.get_Item(key))();
     this.store.Remove(key);
    }
  },
  RegisterElement:function(key,f)
  {
   if(!this.store.ContainsKey(key))
    this.store.set_Item(key,f);
  },
  Init:function()
  {
   this.store=new Dictionary.New$5();
  }
 },Obj,ElementStore);
 ElementStore.NewElementStore=function()
 {
  var store;
  store=new ElementStore.New();
  store.Init();
  return store;
 };
 ElementStore.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },ElementStore);
 Tree$1=Tree.Tree=Runtime.Class({
  get_Sequence:function()
  {
   return this.$==1?[this.$0]:this.$==2?Seq.append(this.$0.get_Sequence(),this.$1.get_Sequence()):[];
  },
  GetEnumerator:function()
  {
   return Enumerator.Get(this.get_Sequence());
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get(this.get_Sequence());
  }
 },null,Tree$1);
 Tree$1.Empty=new Tree$1({
  $:0
 });
 List$1=Collections.List=Runtime.Class({
  GetEnumerator:function()
  {
   return Enumerator.Get(this);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get0(this);
  }
 },null,List$1);
 Util.observer=function(h)
 {
  return{
   OnCompleted:function()
   {
    return null;
   },
   OnError:function()
   {
    return null;
   },
   OnNext:h
  };
 };
 Dictionary=Collections.Dictionary=Runtime.Class({
  ContainsKey:function(k)
  {
   var $this,d;
   $this=this;
   d=this.data[this.hash(k)];
   return d==null?false:Arrays.exists(function(a)
   {
    return $this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d);
  },
  get_Item:function(k)
  {
   return this.get(k);
  },
  Remove:function(k)
  {
   return this.remove(k);
  },
  set_Item:function(k,v)
  {
   this.set(k,v);
  },
  get:function(k)
  {
   var $this,d;
   $this=this;
   d=this.data[this.hash(k)];
   return d==null?DictionaryUtil.notPresent():Arrays.pick(function(a)
   {
    var a$1;
    a$1=Operators.KeyValue(a);
    return $this.equals.apply(null,[a$1[0],k])?{
     $:1,
     $0:a$1[1]
    }:null;
   },d);
  },
  remove:function(k)
  {
   var $this,h,d,r;
   $this=this;
   h=this.hash(k);
   d=this.data[h];
   return d==null?false:(r=Arrays.filter(function(a)
   {
    return!$this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d),Arrays.length(r)<d.length&&(this.count=this.count-1,this.data[h]=r,true));
  },
  set:function(k,v)
  {
   var $this,h,d,m;
   $this=this;
   h=this.hash(k);
   d=this.data[h];
   d==null?(this.count=this.count+1,this.data[h]=new Global.Array({
    K:k,
    V:v
   })):(m=Arrays.tryFindIndex(function(a)
   {
    return $this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d),m==null?(this.count=this.count+1,d.push({
    K:k,
    V:v
   })):d[m.$0]={
    K:k,
    V:v
   });
  },
  GetEnumerator:function()
  {
   return Enumerator.Get0(this);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get0(Arrays.concat(JS.GetFieldValues(this.data)));
  }
 },Obj,Dictionary);
 Dictionary.New$5=Runtime.Ctor(function()
 {
  Dictionary.New$6.call(this,[],Unchecked.Equals,Unchecked.Hash);
 },Dictionary);
 Dictionary.New$6=Runtime.Ctor(function(init,equals,hash)
 {
  var e,x;
  Obj.New.call(this);
  this.equals=equals;
  this.hash=hash;
  this.count=0;
  this.data=[];
  e=Enumerator.Get(init);
  try
  {
   while(e.MoveNext())
    {
     x=e.Current();
     this.set(x.K,x.V);
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 },Dictionary);
 Padding$1.get_Default=function()
 {
  return Padding$1.New(null,null,null,null);
 };
 Padding$1.New=function(Left,Right,Top,Bottom)
 {
  return{
   Left:Left,
   Right:Right,
   Top:Top,
   Bottom:Bottom
  };
 };
 LabelConfiguration.get_Default=function()
 {
  return LabelConfiguration.New({
   $:0
  },{
   $:1
  },{
   $:0
  });
 };
 LabelConfiguration.New=function(Align,VerticalAlign,Placement)
 {
  return{
   Align:Align,
   VerticalAlign:VerticalAlign,
   Placement:Placement
  };
 };
 DictionaryUtil.notPresent=function()
 {
  return Operators.FailWith("The given key was not present in the dictionary.");
 };
 Disposable.New=function(d)
 {
  return{
   Dispose:function()
   {
    return d();
   }
  };
 };
 Observer.New=function(onNext,onComplete)
 {
  return{
   OnNext:onNext,
   OnCompleted:function()
   {
    return onComplete();
   },
   OnError:function()
   {
    return null;
   }
  };
 };
 Runtime.OnLoad(function()
 {
  Test.Main();
 });
}());


if (typeof IntelliFactory !=='undefined') {
  IntelliFactory.Runtime.ScriptBasePath = '/Content/';
  IntelliFactory.Runtime.Start();
}
