namespace WebSharper.TinyMce.Tests

open WebSharper
open WebSharper.JavaScript
open WebSharper.Formlets
open WebSharper.Web
open WebSharper.JQuery
open WebSharper.TinyMce
open WebSharper.Formlets.TinyMce
open WebSharper.Html.Client

module Test =

    module Formlet =
            
        [<JavaScript>]
        let SimpleEditorDefaultConfiguration() =
            let conf = SimpleHtmlEditorConfiguration.Default
    
            Controls.SimpleHtmlEditor conf "default"
            |> Enhance.WithSubmitAndResetButtons


        [<JavaScript>]
        let SimpleEditorCustomConfiguration() =
            let conf = { SimpleHtmlEditorConfiguration.Default with
                            Width = Some 500
                            Height = Some 500
                        }
    
            Controls.SimpleHtmlEditor conf "default"
            |> Enhance.WithSubmitAndResetButtons


        [<JavaScript>]
        let AdvancedEditorDefaultConfiguration() =
            let conf = AdvancedHtmlEditorConfiguration.Default
    
            Controls.AdvancedHtmlEditor conf "default"
            |> Enhance.WithSubmitAndResetButtons
    
    
        [<JavaScript>]
        let AdvancedEditorCustomConfiguration() =
            let conf =
                {AdvancedHtmlEditorConfiguration.Default with
                    Width = Some 600
                    Height = Some 400
                    ToolbarLocation = Some ToolbarLocation.Top
                    ToolbarAlign = Some ToolbarAlign.Left
                    Buttons =
                        Some [
                            [ ButtonType.Bold; ButtonType.Anchor]
                            []
                            []
                        ]
                }
    
            Controls.AdvancedHtmlEditor conf "default"
            |> Enhance.WithSubmitAndResetButtons


    // Direct bindings
    module DirectBindings =
            
        [<JavaScript>]
        let CreatingTinyMce() =
            let Init(tId) =
                let config = 
                    new TinyMCEConfiguration (
                        Theme = "advanced",
                        Mode = Mode.Exact,
                        Elements = tId
                    )
                TinyMCE.Init(config)

            let tId = NewId()
            Div [
                TextArea [Attr.Id tId; Text "default content"]
                |>! OnAfterRender (fun el ->
                        Init(tId)
                    )
            ]

        [<JavaScript>]
        let CreatingTinyMceWithOninitCallback() =
            let Init(tId) =
                let config = 
                    new TinyMCEConfiguration (
                        Theme = "advanced",
                        Mode = Mode.Exact,
                        Elements = tId,
                        
                        Oninit = (fun () ->
                            let editor = TinyMCE.Get(tId)
                            JQuery.Of("#change_on_init").Html("Oninit event executed, editor content: " + editor.GetContent()).Ignore
                        )
                    )
                TinyMCE.Init(config)

            let tId = NewId()
            Div [
                TextArea [Attr.Id tId; Text "default content: oninit"]
                P [Id "change_on_init"]
                |>! OnAfterRender (fun el ->
                        Init(tId)
                    )
            ]

        [<JavaScript>]
        let CreatingTinyMceWithOnchangeCallback() =
            let Init(tId) =
                let config = 
                    new TinyMCEConfiguration (
                        Theme = "advanced",
                        Mode = Mode.Exact,
                        Elements = tId,
                        Onchange_callback = (fun ed ->
                            JS.Alert(ed.GetContent()) 
                        )
                    )
                TinyMCE.Init(config)

            let tId = NewId()
            Div [
                TextArea [Attr.Id tId; Text "default content"]
                |>! OnAfterRender (fun el ->
                        Init(tId)
                )
            ]

        [<JavaScript>]
        let OnKeyupCallback() =
            let Init(tId) =
                let config = 
                    new TinyMCEConfiguration (
                        Theme = "advanced",
                        Mode = Mode.Exact,
                        Elements = tId,
                        Oninit = (fun () ->
                            let editor = TinyMCE.Get(tId)
                            editor.OnKeyUp.Add( fun (ed:Editor) ->
                                JS.Alert(ed.GetContent()) 
                            )
                            |> ignore
                        )
                    )
                TinyMCE.Init(config)

            let tId = NewId()
            Div [
                TextArea [Attr.Id tId; Text "default content"]
                |>! OnAfterRender (fun el ->
                        Init(tId)
                )
            ]

        [<JavaScript>]
        let OnClickCallback() =
            let Init(tId) =
                let config = 
                    new TinyMCEConfiguration (
                        Theme = "advanced",
                        Mode = Mode.Exact,
                        Elements = tId,
                        Oninit = (fun () ->
                            let editor = TinyMCE.Get(tId)
                            editor.OnClick.Add( fun (ed:Editor) ->
                                JS.Alert(ed.GetContent()) 
                            )
                            |> ignore
                        )
                    )
                TinyMCE.Init(config)

            let tId = NewId()
            Div [
                TextArea [Attr.Id tId; Text "default content"]
                |>! OnAfterRender (fun el ->
                        Init(tId)
                )
            ]


        [<JavaScript>]
        let UndoManagerUndoAndRedoButtons() =
            let Init(tId) =
                let config = 
                    new TinyMCEConfiguration (
                        Theme = "advanced",
                        Mode = Mode.Exact,
                        Elements = tId
                    )
                TinyMCE.Init(config)

            let tId = NewId()
            Div [
                TextArea [Attr.Id tId; Text "default content"]
                |>! OnAfterRender (fun el ->
                        Init(tId)
                )
                Button [Text "undo"]
                |>! OnClick (fun el e ->
                        let undoManager = TinyMCE.Get(tId).UndoManager
                        undoManager.Undo()
                        |> ignore
                )
                Button [Text "redo"]
                |>! OnClick (fun el e ->
                        let undoManager = TinyMCE.Get(tId).UndoManager
                        undoManager.Redo()
                        |> ignore
                )
            ]


        [<JavaScript>]
        let EditorSelectionGetReplace() =
            let Init(tId) =
                let config = 
                    new TinyMCEConfiguration (
                        Theme = "advanced",
                        Mode = Mode.Exact,
                        Elements = tId
                    )
                TinyMCE.Init(config)

            let tId = NewId()
            Div [
                TextArea [Attr.Id tId; Text "default content"]
                |>! OnAfterRender (fun el ->
                        Init(tId)
                )
                Button [Text "get selection"]
                |>! OnClick (fun el e ->
                        let selection = TinyMCE.Get(tId).Selection
                        JS.Alert(selection.GetContent())
                )
                Button [Text "replace selection with foo"]
                |>! OnClick (fun el e ->
                        let selection = TinyMCE.Get(tId).Selection
                        selection.SetContent("foo")
                )
            ]


    module Plugin = 

        [<Inline "eval($s)">]
        let Raw<'T> s : 'T = failwith "raw" 

        [<JavaScript>]
        let CustomListBoxSplitButton() =
            let Init(tId) =

                let listBoxConf =  
                    new ControlConfiguration(
                        Title = "My list box",
                        Onselect = (fun (v) ->
                            TinyMCE.ActiveEditor.WindowManager.Alert("Value selected:" + v)
                        )
                    )

                let splitButtonConf =  
                    new ControlConfiguration(
                        Title = "My split button",
                        Image = "img/example.gif",
                        Onclick = (fun () ->
                            TinyMCE.ActiveEditor.WindowManager.Alert("Button was clicked.")
                        )
                    )


                let createMenu (name:string, cm:ControlManager) = 
                    match name with
                    | "mylistbox" -> 
                        let mlb = cm.CreateListBox("mylistbox",  listBoxConf)

                        mlb.Add("Some item 1", "val1")
                        mlb.Add("Some item 2", "val2")
                        mlb.Add("Some item 3", "val3")
    

                        mlb :> TinyMce.Control

                    | "mysplitbutton" -> 
                        let c = cm.CreateSplitButton("mysplitbutton",  splitButtonConf )

                        c.OnRenderMenu.Add (fun (c,m:DropMenu) ->
                                m.Add(new ControlConfiguration(Title = "Some title", Class = "mceMenuItemTitle"))
                                |> ignore

                                m.Add(new ControlConfiguration(Title = "Some item 1", Onclick = (fun () ->
                                        TinyMCE.ActiveEditor.WindowManager.Alert("Some  item 1 was clicked")
                                        )
                                    )
                                ) |> ignore

                                m.Add(new ControlConfiguration(Title = "Some item 2", Onclick = (fun () ->
                                        TinyMCE.ActiveEditor.WindowManager.Alert("Some  item 2 was clicked")
                                        )
                                    )
                                ) |> ignore

                        ) |> ignore
    

                        c :> TinyMce.Control

                    | _ -> null


                let plugin = new Plugin ( CreateControl = fun name cm -> createMenu(name, cm) )

                TinyMCE.Create("tinymce.plugins.CustomListBoxSplitButtonPlugin", plugin)

                TinyMce.PluginManager.Add("exampleCustomListBoxSplitButton", Raw "tinymce.plugins.CustomListBoxSplitButtonPlugin")

                let editorConfig = 
                    new TinyMCEConfiguration (
                        Theme = "advanced",
                        Mode = Mode.Exact,
                        Elements = tId,
                        Theme_advanced_toolbar_location = ToolbarLocation.Top,
                        Plugins = "-exampleCustomListBoxSplitButton",
                        Theme_advanced_buttons1 = "mylistbox,mysplitbutton,bold",
                        Theme_advanced_buttons2 = "", 
                        Theme_advanced_buttons3 = "",
                        Theme_advanced_buttons4 = "" 
                    )
                

                TinyMCE.Init(editorConfig)


            let tId = NewId()
            Div [
                TextArea [Attr.Id tId; Text "default content"]
                |>! OnAfterRender (fun el ->
                        Init(tId)
                )
            ]


        [<JavaScript>]
        let MenuButton() =
            let Init(tId) =

                let menuConf =  
                    new ControlConfiguration(
                        Title = "My menu button",
                        Image = "img/example.gif",
                        Icons = false
                    )

                let createMenu (name:string, ctrlMgr:ControlManager) = 
                    match name with
                    | "mymenubutton" -> 
                        let c = ctrlMgr.CreateMenuButton("mymenubutton",  menuConf )
    
                        c.OnRenderMenu.Add (fun (o,m:DropMenu) ->

                                    m.Add(new ControlConfiguration(Title = "Some item 1", Onclick = (fun () ->
                                            TinyMCE.ActiveEditor.ExecCommand("mceInsertContent", false, "Some item 1")
                                            )
                                        )
                                    ) |> ignore

                                    m.Add(new ControlConfiguration(Title = "Some item 2", Onclick = (fun () ->
                                            TinyMCE.ActiveEditor.ExecCommand("mceInsertContent", false, "Some item 2")
                                            )
                                        )
                                    ) |> ignore

                                    let sub = m.AddMenu(new ControlConfiguration(Title = "Some item 3"))

                                    sub.Add(new ControlConfiguration(Title = "Some item 3.1", Onclick = (fun () ->
                                            TinyMCE.ActiveEditor.ExecCommand("mceInsertContent", false, "Some item 3.1")
                                            )
                                        )
                                    ) |> ignore

                                    sub.Add(new ControlConfiguration(Title = "Some item 3.2", Onclick = (fun () ->
                                            TinyMCE.ActiveEditor.ExecCommand("mceInsertContent", false, "Some item 3.2")
                                            )
                                        )
                                    ) |> ignore

                        ) |> ignore 

                        c :> TinyMce.Control

                    | _ -> null


                let plugin = new Plugin ( CreateControl = fun name cm -> createMenu(name, cm) )

                TinyMCE.Create("tinymce.plugins.MenuButtonPlugin", plugin)

                TinyMce.PluginManager.Add("exampleMenuButton", Raw "tinymce.plugins.MenuButtonPlugin")

                let editorConfig = 
                    new TinyMCEConfiguration (
                        Theme = "advanced",
                        Mode = Mode.Exact,
                        Elements = tId,
                        Theme_advanced_toolbar_location = ToolbarLocation.Top,
                        Plugins = "-exampleMenuButton",
                        Theme_advanced_buttons1 = "mymenubutton,bold",
                        Theme_advanced_buttons2 = "", 
                        Theme_advanced_buttons3 = "",
                        Theme_advanced_buttons4 = "" 
                    )
                

                TinyMCE.Init(editorConfig)


            let tId = NewId()
            Div [
                TextArea [Attr.Id tId; Text "default content"]
                |>! OnAfterRender (fun el ->
                        Init(tId)
                )
            ]

        [<JavaScript>]
        let CustomToolbarButton() =
            let Init(tId) =

                let editorConfig = 
                    new TinyMCEConfiguration (
                        Theme = "advanced",
                        Mode = Mode.Exact,
                        Elements = tId,
                        Theme_advanced_toolbar_location = ToolbarLocation.Top,
                        Theme_advanced_buttons1 = "mybutton,bold",
                        Theme_advanced_buttons2 = "", 
                        Theme_advanced_buttons3 = "",
                        Theme_advanced_buttons4 = "" ,
                        Setup = (fun (ed:Editor) ->
                                   ed.AddButton("mybutton", new ControlConfiguration(
                                                                Title = "My button",
                                                                Image = "img/example.gif",
                                                                Onclick = (fun () ->
                                                                    ed.Focus(false)
                                                                    ed.Selection.SetContent("Hello world!")
                                                                )
                                                            )
                                   )
                        )
                                         
                    )
                

                TinyMCE.Init(editorConfig)


            let tId = NewId()
            Div [
                TextArea [Attr.Id tId; Text "default content"]
                |>! OnAfterRender (fun el ->
                        Init(tId)
                )
            ]


    // Test helpers
    
    [<JavaScript>]
    let TestFormlet (name: string)  (descr: string) (formlet: Formlet<string>) =
        Div [
            H3 [Text name]
            P [Text descr] 
            P [
                Formlet.Do {
                    let! v = formlet
                    let! _ = Controls.TextArea v
                    return ()
                }
                |> Enhance.WithFormContainer
            ]
        ]
    
    [<JavaScript>]
    let TestDirectBindings (name: string)  (descr: string) (element: Element) =
        Div [
            H3 [Text name]
            P [Text descr] 
            element
        ]



    // Test runner

    [<JavaScript>]
    let Run() =
        Div [
            // Formlet tests
            TestFormlet "SimpleHtmlEditor" "Creates SimpleHtmlEditor with default configuration"  <|
                Formlet.SimpleEditorDefaultConfiguration()

            TestFormlet "SimpleHtmlEditor" "Creates SimpleHtmlEditor with custom configuration: width = 500, height = 500"  <|
                Formlet.SimpleEditorCustomConfiguration()

            TestFormlet "AdvancedHtmlEditor" "Creates AdvancedHtmlEditor with default configuration"  <|
                Formlet.AdvancedEditorDefaultConfiguration()

            TestFormlet "AdvancedHtmlEditor" "Creates AdvancedHtmlEditor with custom configuration: width = 600, height = 400, ToolbarLocation = Top, ToolbarAlign = Left, Plugins = table,contextmenu,paste, Only first row of Buttons = Bold, Anchor"  <|
                Formlet.AdvancedEditorCustomConfiguration()


            // Direct bindings tests
            TestDirectBindings "Creating TinyMCE with direct bindings" "TinyMCE should be visible" <|
                DirectBindings.CreatingTinyMce()

            TestDirectBindings "Creating TinyMCE with direct bindings, Oninit callback" "When TinyMCE is initialized p element below the editor should have the editor's content" <|
                DirectBindings.CreatingTinyMceWithOninitCallback()

            TestDirectBindings "Creating TinyMCE with direct bindings, Onchange callback" "When TinyMCE content is changed JavaScript Alert dialog is shown with the editor's content" <|
                DirectBindings.CreatingTinyMceWithOnchangeCallback()

            TestDirectBindings "Creating TinyMCE with direct bindings, OnKeyUp event" "When OnKeyUp event fires JavaScript alert box with editor's content is shown" <|
                DirectBindings.OnKeyupCallback()

            TestDirectBindings "Creating TinyMCE with direct bindings, OnClick event" "When OnClick event fires JavaScript alert box with editor's content is shown" <|
                DirectBindings.OnClickCallback()

            TestDirectBindings "Using UndoManager to undo and redo changes" "Buttons below undo and redo changes" <|
                DirectBindings.UndoManagerUndoAndRedoButtons()

            TestDirectBindings "The editor's selection" "Clicking buttons below gets selection and replaces selected content" <|
                DirectBindings.EditorSelectionGetReplace()


            // plugins
            TestDirectBindings "Plugin: Custom ListBox and SplitButton" "Toolbar should have custom ListBox and SplitButton" <|
                Plugin.CustomListBoxSplitButton()

            TestDirectBindings "Plugin: MenuButton" "Toolbar should have custom MenuButton" <|
                Plugin.MenuButton()

            TestDirectBindings "Plugin: Custom toolbar button" "Toolbar should have custom Button" <|
                Plugin.CustomToolbarButton()
        ]

    [<SPAEntryPoint; JavaScript>]
    let Main() =
        Run().AppendTo("main")
