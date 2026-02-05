' ============================================
' MACRO VBA - VENTAS POR RUTA EN TIEMPO REAL
' Sistema Garlo Alimentos
' ============================================
' Instrucciones:
' 1. Abrir Excel y presionar Alt + F11 para abrir el Editor VBA
' 2. Insertar > Modulo
' 3. Pegar todo este codigo
' 4. Cerrar el editor y ejecutar la macro "CargarVentasEnTiempoReal"
'
' IMPORTANTE: Necesitas habilitar las referencias:
' - Microsoft XML, v6.0
' - Microsoft Scripting Runtime
' ============================================

Option Explicit

' Configuracion - CAMBIAR ESTOS VALORES
Private Const API_BASE_URL As String = "https://garloalimentos.com"
Private Const USERNAME As String = "admin"  ' Cambiar por tu usuario
Private Const PASSWORD As String = "1234"   ' Cambiar por tu contrasena

Private mToken As String

' ============================================
' FUNCION PRINCIPAL - Ejecutar esta macro
' ============================================
Public Sub CargarVentasEnTiempoReal()
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    ' Paso 1: Autenticarse y obtener token
    If Not Autenticar() Then
        MsgBox "Error al autenticar. Verifica usuario y contrasena.", vbCritical
        GoTo Cleanup
    End If
    
    ' Paso 2: Obtener todas las ventas
    Dim ventasJson As String
    ventasJson = ObtenerVentas()
    
    If ventasJson = "" Then
        MsgBox "No se pudieron obtener las ventas.", vbCritical
        GoTo Cleanup
    End If
    
    ' Paso 3: Procesar y crear hojas
    ProcesarVentas ventasJson
    
    MsgBox "Datos cargados exitosamente!", vbInformation
    
Cleanup:
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    Exit Sub
    
ErrorHandler:
    MsgBox "Error: " & Err.Description, vbCritical
    Resume Cleanup
End Sub

' ============================================
' AUTENTICACION
' ============================================
Private Function Autenticar() As Boolean
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    Dim url As String
    url = API_BASE_URL & "/api/auth/login"
    
    Dim body As String
    body = "{""username"":""" & USERNAME & """,""password"":""" & PASSWORD & """}"
    
    http.Open "POST", url, False
    http.setRequestHeader "Content-Type", "application/json"
    http.send body
    
    If http.Status = 200 Then
        Dim response As String
        response = http.responseText
        
        ' Extraer token del JSON
        mToken = ExtraerValorJSON(response, "token")
        Autenticar = (mToken <> "")
    Else
        Autenticar = False
    End If
End Function

' ============================================
' OBTENER VENTAS
' ============================================
Private Function ObtenerVentas() As String
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    Dim url As String
    url = API_BASE_URL & "/api/ventas/todas?limit=10000"
    
    http.Open "GET", url, False
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "Authorization", "Bearer " & mToken
    http.send
    
    If http.Status = 200 Then
        ObtenerVentas = http.responseText
    Else
        ObtenerVentas = ""
    End If
End Function

' ============================================
' PROCESAR VENTAS Y CREAR HOJAS
' ============================================
Private Sub ProcesarVentas(jsonString As String)
    Dim ventasArray As Collection
    Set ventasArray = ParsearVentasJSON(jsonString)
    
    If ventasArray Is Nothing Or ventasArray.Count = 0 Then
        MsgBox "No hay ventas para mostrar.", vbInformation
        Exit Sub
    End If
    
    ' Agrupar ventas por ruta
    Dim rutasDict As Object
    Set rutasDict = CreateObject("Scripting.Dictionary")
    
    Dim venta As Object
    Dim rutaNombre As String
    Dim i As Long
    
    For i = 1 To ventasArray.Count
        Set venta = ventasArray(i)
        rutaNombre = venta("ruta_nombre")
        
        If Not rutasDict.Exists(rutaNombre) Then
            rutasDict.Add rutaNombre, New Collection
        End If
        
        rutasDict(rutaNombre).Add venta
    Next i
    
    ' Crear una hoja por cada ruta
    Dim rutaKey As Variant
    Dim rutaIndex As Integer
    rutaIndex = 1
    
    For Each rutaKey In rutasDict.Keys
        CrearHojaRuta CStr(rutaKey), rutasDict(rutaKey), rutaIndex
        rutaIndex = rutaIndex + 1
    Next rutaKey
End Sub

' ============================================
' CREAR HOJA PARA UNA RUTA
' ============================================
Private Sub CrearHojaRuta(rutaNombre As String, ventas As Collection, rutaIndex As Integer)
    Dim ws As Worksheet
    Dim sheetName As String
    
    ' Nombre de hoja: R1, R2, R3, etc.
    sheetName = "R" & rutaIndex
    
    ' Eliminar hoja si existe
    On Error Resume Next
    Application.DisplayAlerts = False
    ThisWorkbook.Sheets(sheetName).Delete
    Application.DisplayAlerts = True
    On Error GoTo 0
    
    ' Crear nueva hoja
    Set ws = ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count))
    ws.Name = sheetName
    
    ' Titulo de la ruta
    ws.Range("A1").Value = rutaNombre
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Font.Size = 14
    
    ' Encabezados
    Dim headers As Variant
    headers = Array("Folio", "Fecha", "Hora", "Cliente", "Cantidad Compra", "Tipo Pago", "Subtotal", "Descuentos", "Total")
    
    Dim col As Integer
    For col = 0 To UBound(headers)
        ws.Cells(3, col + 1).Value = headers(col)
        ws.Cells(3, col + 1).Font.Bold = True
        ws.Cells(3, col + 1).Interior.Color = RGB(79, 129, 189)
        ws.Cells(3, col + 1).Font.Color = RGB(255, 255, 255)
    Next col
    
    ' Ordenar ventas por fecha (mas reciente primero)
    Dim ventasOrdenadas As Collection
    Set ventasOrdenadas = OrdenarVentasPorFecha(ventas)
    
    ' Escribir datos con separacion por fecha
    Dim fila As Long
    fila = 4
    
    Dim venta As Object
    Dim fechaActual As String
    Dim fechaAnterior As String
    fechaAnterior = ""
    
    Dim i As Long
    For i = 1 To ventasOrdenadas.Count
        Set venta = ventasOrdenadas(i)
        
        ' Extraer fecha (solo dia)
        fechaActual = Left(venta("fechaIso"), 10)
        
        ' Si cambia la fecha, agregar fila en blanco
        If fechaAnterior <> "" And fechaActual <> fechaAnterior Then
            fila = fila + 1 ' Fila en blanco para separar dias
        End If
        
        ' Calcular cantidad de compra (sumar items)
        Dim cantidadCompra As String
        cantidadCompra = CalcularCantidadCompra(venta)
        
        ' Calcular subtotal y descuentos
        Dim subtotal As Double
        Dim descuentos As Double
        CalcularTotales venta, subtotal, descuentos
        
        ' Escribir fila
        ws.Cells(fila, 1).Value = venta("id") ' Folio
        ws.Cells(fila, 2).Value = FormatearFecha(venta("fechaIso")) ' Fecha
        ws.Cells(fila, 3).Value = FormatearHora(venta("fechaIso")) ' Hora
        ws.Cells(fila, 4).Value = venta("cliente_nombre") ' Cliente
        ws.Cells(fila, 5).Value = cantidadCompra ' Cantidad de compra
        ws.Cells(fila, 6).Value = venta("tipoPago") ' Tipo pago
        ws.Cells(fila, 7).Value = subtotal ' Subtotal
        ws.Cells(fila, 7).NumberFormat = "$#,##0.00"
        ws.Cells(fila, 8).Value = descuentos ' Descuentos
        ws.Cells(fila, 8).NumberFormat = "$#,##0.00"
        ws.Cells(fila, 9).Value = CDbl(venta("total")) ' Total
        ws.Cells(fila, 9).NumberFormat = "$#,##0.00"
        
        fechaAnterior = fechaActual
        fila = fila + 1
    Next i
    
    ' Ajustar ancho de columnas
    ws.Columns("A:I").AutoFit
    
    ' Agregar bordes
    If fila > 4 Then
        ws.Range(ws.Cells(3, 1), ws.Cells(fila - 1, 9)).Borders.LineStyle = xlContinuous
    End If
End Sub

' ============================================
' FUNCIONES AUXILIARES
' ============================================

Private Function OrdenarVentasPorFecha(ventas As Collection) As Collection
    ' Ordenar de mas reciente a mas antiguo usando bubble sort simple
    Dim arr() As Variant
    ReDim arr(1 To ventas.Count)
    
    Dim i As Long
    For i = 1 To ventas.Count
        Set arr(i) = ventas(i)
    Next i
    
    ' Bubble sort por fecha descendente
    Dim j As Long
    Dim temp As Object
    For i = 1 To UBound(arr) - 1
        For j = i + 1 To UBound(arr)
            If arr(i)("fechaIso") < arr(j)("fechaIso") Then
                Set temp = arr(i)
                Set arr(i) = arr(j)
                Set arr(j) = temp
            End If
        Next j
    Next i
    
    ' Convertir array a collection
    Dim result As New Collection
    For i = 1 To UBound(arr)
        result.Add arr(i)
    Next i
    
    Set OrdenarVentasPorFecha = result
End Function

Private Function CalcularCantidadCompra(venta As Object) As String
    Dim items As Collection
    Dim totalKg As Double
    Dim totalPzas As Double
    Dim resultado As String
    
    On Error Resume Next
    Set items = venta("items")
    On Error GoTo 0
    
    If items Is Nothing Then
        CalcularCantidadCompra = "0"
        Exit Function
    End If
    
    totalKg = 0
    totalPzas = 0
    
    Dim item As Object
    Dim i As Long
    For i = 1 To items.Count
        Set item = items(i)
        
        Dim unidad As String
        unidad = UCase(item("unidad"))
        
        If unidad = "KG" Then
            totalKg = totalKg + CDbl(item("kilos"))
        ElseIf unidad = "MIXTO" Then
            totalKg = totalKg + CDbl(item("kilos"))
            totalPzas = totalPzas + CDbl(item("cantidad"))
        Else ' PIEZA
            totalPzas = totalPzas + CDbl(item("cantidad"))
        End If
    Next i
    
    ' Formatear resultado
    If totalKg > 0 And totalPzas > 0 Then
        resultado = Format(totalKg, "0.00") & " Kg, " & Format(totalPzas, "0") & " Pzas (Mixto)"
    ElseIf totalKg > 0 Then
        resultado = Format(totalKg, "0.00") & " Kg"
    Else
        resultado = Format(totalPzas, "0") & " Pzas"
    End If
    
    CalcularCantidadCompra = resultado
End Function

Private Sub CalcularTotales(venta As Object, ByRef subtotal As Double, ByRef descuentos As Double)
    Dim items As Collection
    
    On Error Resume Next
    Set items = venta("items")
    On Error GoTo 0
    
    subtotal = 0
    descuentos = 0
    
    If items Is Nothing Then Exit Sub
    
    Dim item As Object
    Dim i As Long
    For i = 1 To items.Count
        Set item = items(i)
        subtotal = subtotal + CDbl(item("subtotal"))
        descuentos = descuentos + (CDbl(item("descuentoUnitario")) * CDbl(item("cantidad")))
    Next i
End Sub

Private Function FormatearFecha(fechaIso As String) As String
    ' Formato: YYYY-MM-DD -> DD/MM/YYYY
    Dim partes() As String
    partes = Split(Left(fechaIso, 10), "-")
    
    If UBound(partes) >= 2 Then
        FormatearFecha = partes(2) & "/" & partes(1) & "/" & partes(0)
    Else
        FormatearFecha = fechaIso
    End If
End Function

Private Function FormatearHora(fechaIso As String) As String
    ' Extraer hora de ISO string
    If Len(fechaIso) >= 19 Then
        FormatearHora = Mid(fechaIso, 12, 5) ' HH:MM
    Else
        FormatearHora = ""
    End If
End Function

Private Function ExtraerValorJSON(json As String, key As String) As String
    ' Extrae un valor simple de JSON
    Dim patron As String
    Dim inicio As Long
    Dim fin As Long
    
    patron = """" & key & """:"
    inicio = InStr(json, patron)
    
    If inicio = 0 Then
        ExtraerValorJSON = ""
        Exit Function
    End If
    
    inicio = inicio + Len(patron)
    
    ' Saltar espacios
    Do While Mid(json, inicio, 1) = " "
        inicio = inicio + 1
    Loop
    
    ' Verificar si es string (comienza con comillas)
    If Mid(json, inicio, 1) = """" Then
        inicio = inicio + 1
        fin = InStr(inicio, json, """")
        ExtraerValorJSON = Mid(json, inicio, fin - inicio)
    Else
        ' Es numero u otro tipo
        fin = inicio
        Do While fin <= Len(json)
            Dim c As String
            c = Mid(json, fin, 1)
            If c = "," Or c = "}" Or c = "]" Then Exit Do
            fin = fin + 1
        Loop
        ExtraerValorJSON = Trim(Mid(json, inicio, fin - inicio))
    End If
End Function

' ============================================
' PARSER JSON SIMPLE
' ============================================
Private Function ParsearVentasJSON(jsonString As String) As Collection
    Dim result As New Collection
    
    ' Buscar el array de ventas
    Dim inicio As Long
    inicio = InStr(jsonString, """ventas"":")
    
    If inicio = 0 Then
        Set ParsearVentasJSON = result
        Exit Function
    End If
    
    ' Encontrar el inicio del array
    inicio = InStr(inicio, jsonString, "[")
    If inicio = 0 Then
        Set ParsearVentasJSON = result
        Exit Function
    End If
    
    ' Encontrar el fin del array
    Dim fin As Long
    Dim nivel As Integer
    nivel = 1
    fin = inicio + 1
    
    Do While fin <= Len(jsonString) And nivel > 0
        Dim c As String
        c = Mid(jsonString, fin, 1)
        If c = "[" Then nivel = nivel + 1
        If c = "]" Then nivel = nivel - 1
        fin = fin + 1
    Loop
    
    Dim ventasStr As String
    ventasStr = Mid(jsonString, inicio + 1, fin - inicio - 2)
    
    ' Parsear cada objeto de venta
    Dim pos As Long
    pos = 1
    
    Do While pos < Len(ventasStr)
        ' Encontrar inicio de objeto
        Dim objInicio As Long
        objInicio = InStr(pos, ventasStr, "{")
        If objInicio = 0 Then Exit Do
        
        ' Encontrar fin de objeto (manejando objetos anidados)
        Dim objFin As Long
        nivel = 1
        objFin = objInicio + 1
        
        Do While objFin <= Len(ventasStr) And nivel > 0
            c = Mid(ventasStr, objFin, 1)
            If c = "{" Then nivel = nivel + 1
            If c = "}" Then nivel = nivel - 1
            objFin = objFin + 1
        Loop
        
        Dim objStr As String
        objStr = Mid(ventasStr, objInicio, objFin - objInicio)
        
        ' Parsear objeto
        Dim obj As Object
        Set obj = ParsearObjetoJSON(objStr)
        
        If Not obj Is Nothing Then
            result.Add obj
        End If
        
        pos = objFin
    Loop
    
    Set ParsearVentasJSON = result
End Function

Private Function ParsearObjetoJSON(objStr As String) As Object
    Dim dict As Object
    Set dict = CreateObject("Scripting.Dictionary")
    
    ' Extraer campos conocidos
    dict("id") = ExtraerValorJSON(objStr, "id")
    dict("fechaIso") = ExtraerValorJSON(objStr, "fechaIso")
    dict("ruta_nombre") = ExtraerValorJSON(objStr, "ruta_nombre")
    dict("cliente_nombre") = ExtraerValorJSON(objStr, "cliente_nombre")
    dict("tipoPago") = ExtraerValorJSON(objStr, "tipoPago")
    dict("total") = ExtraerValorJSON(objStr, "total")
    
    ' Parsear items
    Dim itemsCol As New Collection
    Dim itemsInicio As Long
    itemsInicio = InStr(objStr, """items"":")
    
    If itemsInicio > 0 Then
        itemsInicio = InStr(itemsInicio, objStr, "[")
        If itemsInicio > 0 Then
            Dim itemsFin As Long
            Dim nivel As Integer
            nivel = 1
            itemsFin = itemsInicio + 1
            
            Do While itemsFin <= Len(objStr) And nivel > 0
                Dim c As String
                c = Mid(objStr, itemsFin, 1)
                If c = "[" Then nivel = nivel + 1
                If c = "]" Then nivel = nivel - 1
                itemsFin = itemsFin + 1
            Loop
            
            Dim itemsStr As String
            itemsStr = Mid(objStr, itemsInicio + 1, itemsFin - itemsInicio - 2)
            
            ' Parsear cada item
            Dim itemPos As Long
            itemPos = 1
            
            Do While itemPos < Len(itemsStr)
                Dim itemObjInicio As Long
                itemObjInicio = InStr(itemPos, itemsStr, "{")
                If itemObjInicio = 0 Then Exit Do
                
                Dim itemObjFin As Long
                nivel = 1
                itemObjFin = itemObjInicio + 1
                
                Do While itemObjFin <= Len(itemsStr) And nivel > 0
                    c = Mid(itemsStr, itemObjFin, 1)
                    If c = "{" Then nivel = nivel + 1
                    If c = "}" Then nivel = nivel - 1
                    itemObjFin = itemObjFin + 1
                Loop
                
                Dim itemStr As String
                itemStr = Mid(itemsStr, itemObjInicio, itemObjFin - itemObjInicio)
                
                Dim itemDict As Object
                Set itemDict = CreateObject("Scripting.Dictionary")
                itemDict("unidad") = ExtraerValorJSON(itemStr, "unidad")
                itemDict("cantidad") = ExtraerValorJSON(itemStr, "cantidad")
                itemDict("kilos") = ExtraerValorJSON(itemStr, "kilos")
                itemDict("subtotal") = ExtraerValorJSON(itemStr, "subtotal")
                itemDict("descuentoUnitario") = ExtraerValorJSON(itemStr, "descuentoUnitario")
                
                ' Manejar valores nulos
                If itemDict("kilos") = "" Or itemDict("kilos") = "null" Then itemDict("kilos") = "0"
                If itemDict("cantidad") = "" Or itemDict("cantidad") = "null" Then itemDict("cantidad") = "0"
                If itemDict("descuentoUnitario") = "" Or itemDict("descuentoUnitario") = "null" Then itemDict("descuentoUnitario") = "0"
                
                itemsCol.Add itemDict
                itemPos = itemObjFin
            Loop
        End If
    End If
    
    Set dict("items") = itemsCol
    Set ParsearObjetoJSON = dict
End Function

' ============================================
' MACRO PARA ACTUALIZAR (REFRESCAR DATOS)
' ============================================
Public Sub ActualizarDatos()
    CargarVentasEnTiempoReal
End Sub
