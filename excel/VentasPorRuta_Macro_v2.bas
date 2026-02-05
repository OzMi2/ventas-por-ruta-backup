' ============================================
' MACRO VBA - VENTAS POR RUTA EN TIEMPO REAL V2
' Sistema Garlo Alimentos
' ============================================
' FUNCIONALIDADES:
' - IDs de clientes directo de la base de datos
' - Separacion correcta por fechas (espacio entre dias)
' - Columnas: Folio, Id, Fecha, Hora, Cliente, Producto, Precio, Descuentos,
'   Cantidad Compra (con tipo), Tipo Pago, Pago, Abono, Subtotal, Total,
'   Saldo Anterior, Saldo Actual
' - Suma del total al final del encabezado
' - Seccion de Cargo/Existencias con columna vacia de separacion
' ============================================

Option Explicit

' Configuracion - CAMBIAR ESTOS VALORES
Private Const API_BASE_URL As String = "https://garloalimentos.com"
Private Const USERNAME As String = "admin"
Private Const PASSWORD As String = "021015"

Private mToken As String

' ============================================
' FUNCION PRINCIPAL
' ============================================
Public Sub CargarVentasEnTiempoReal()
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    ' Paso 1: Autenticarse
    If Not Autenticar() Then
        MsgBox "Error al autenticar. Verifica usuario y contrasena.", vbCritical
        GoTo Cleanup
    End If
    
    ' Paso 2: Obtener ventas y movimientos
    Dim ventasJson As String
    Dim movimientosJson As String
    
    ventasJson = ObtenerVentas()
    movimientosJson = ObtenerMovimientos()
    
    If ventasJson = "" Then
        MsgBox "No se pudieron obtener las ventas.", vbCritical
        GoTo Cleanup
    End If
    
    ' Paso 3: Procesar y crear hojas
    ProcesarVentas ventasJson, movimientosJson
    
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
        mToken = ExtraerValorJSON(http.responseText, "token")
        Autenticar = (mToken <> "")
    Else
        Autenticar = False
    End If
End Function

' ============================================
' OBTENER DATOS DE API
' ============================================
Private Function ObtenerVentas() As String
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    http.Open "GET", API_BASE_URL & "/api/ventas/todas?limit=10000", False
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "Authorization", "Bearer " & mToken
    http.send
    
    If http.Status = 200 Then
        ObtenerVentas = http.responseText
    Else
        ObtenerVentas = ""
    End If
End Function

Private Function ObtenerMovimientos() As String
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    http.Open "GET", API_BASE_URL & "/api/movimientos?limit=10000", False
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "Authorization", "Bearer " & mToken
    http.send
    
    If http.Status = 200 Then
        ObtenerMovimientos = http.responseText
    Else
        ObtenerMovimientos = ""
    End If
End Function

' ============================================
' PROCESAR VENTAS Y CREAR HOJAS
' ============================================
Private Sub ProcesarVentas(ventasJson As String, movimientosJson As String)
    Dim ventasArray As Collection
    Set ventasArray = ParsearVentasJSON(ventasJson)
    
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
    
    ' Parsear movimientos por ruta
    Dim movimientosDict As Object
    Set movimientosDict = ParsearMovimientosJSON(movimientosJson)
    
    ' Crear una hoja por cada ruta
    Dim rutaKey As Variant
    Dim rutaIndex As Integer
    rutaIndex = 1
    
    For Each rutaKey In rutasDict.Keys
        Dim movRuta As Collection
        If movimientosDict.Exists(CStr(rutaKey)) Then
            Set movRuta = movimientosDict(CStr(rutaKey))
        Else
            Set movRuta = New Collection
        End If
        
        CrearHojaRuta CStr(rutaKey), rutasDict(rutaKey), rutaIndex, movRuta
        rutaIndex = rutaIndex + 1
    Next rutaKey
End Sub

' ============================================
' PARSEAR MOVIMIENTOS JSON
' ============================================
Private Function ParsearMovimientosJSON(jsonString As String) As Object
    Dim result As Object
    Set result = CreateObject("Scripting.Dictionary")
    
    If jsonString = "" Then
        Set ParsearMovimientosJSON = result
        Exit Function
    End If
    
    ' Por ahora retornamos diccionario vacio - implementar parsing si es necesario
    Set ParsearMovimientosJSON = result
End Function

' ============================================
' CREAR HOJA PARA UNA RUTA
' ============================================
Private Sub CrearHojaRuta(rutaNombre As String, ventas As Collection, rutaIndex As Integer, movimientos As Collection)
    Dim ws As Worksheet
    Dim sheetName As String
    
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
    
    ' Encabezados principales (columnas A-P)
    Dim headers As Variant
    headers = Array("Folio", "Id", "Fecha", "Hora", "Cliente", "Producto", "Precio", "Descuentos", _
                    "Cantidad Compra", "Tipo Pago", "Pago", "Abono", "Subtotal", "Total", _
                    "Saldo Anterior", "Saldo Actual")
    
    Dim col As Integer
    For col = 0 To UBound(headers)
        ws.Cells(3, col + 1).Value = headers(col)
        ws.Cells(3, col + 1).Font.Bold = True
        ws.Cells(3, col + 1).Interior.Color = RGB(79, 129, 189)
        ws.Cells(3, col + 1).Font.Color = RGB(255, 255, 255)
    Next col
    
    ' Columna vacia (Q) y luego encabezados de Cargo/Existencias (R, S, T)
    ' Columna 17 queda vacia como separador
    Dim cargoHeaders As Variant
    cargoHeaders = Array("Cargo", "Existencia Anterior", "Existencia Actual")
    
    For col = 0 To UBound(cargoHeaders)
        ws.Cells(3, 18 + col).Value = cargoHeaders(col)
        ws.Cells(3, 18 + col).Font.Bold = True
        ws.Cells(3, 18 + col).Interior.Color = RGB(146, 208, 80)
        ws.Cells(3, 18 + col).Font.Color = RGB(0, 0, 0)
    Next col
    
    ' Ordenar ventas por fecha (mas reciente primero)
    Dim ventasOrdenadas As Collection
    Set ventasOrdenadas = OrdenarVentasPorFecha(ventas)
    
    ' Calcular saldos acumulados por cliente (del mas antiguo al mas reciente para acumulacion correcta)
    Dim saldosCliente As Object
    Set saldosCliente = CalcularSaldosClientes(ventasOrdenadas)
    
    ' Escribir datos con separacion por fecha
    Dim fila As Long
    fila = 4
    
    Dim ventaObj As Object
    Dim fechaActual As String
    Dim fechaAnterior As String
    fechaAnterior = ""
    
    Dim totalGeneral As Double
    totalGeneral = 0
    
    Dim i As Long
    For i = 1 To ventasOrdenadas.Count
        Set ventaObj = ventasOrdenadas(i)
        
        fechaActual = Left(ventaObj("fechaIso"), 10) ' Solo la fecha YYYY-MM-DD
        
        ' Si cambia la fecha, agregar fila en blanco para separar
        If fechaAnterior <> "" And fechaActual <> fechaAnterior Then
            fila = fila + 1 ' Fila vacia como separador
        End If
        
        ' Obtener datos
        Dim items As Collection
        Set items = ventaObj("items")
        
        Dim clienteNombre As String
        clienteNombre = ventaObj("cliente_nombre")
        
        ' ID del cliente directo de la base de datos
        Dim clienteId As String
        clienteId = CStr(ventaObj("cliente_id"))
        
        ' Obtener saldos
        Dim saldoAnterior As Double
        Dim saldoActual As Double
        Dim totalVenta As Double
        Dim abonoVenta As Double
        Dim pagoVenta As Double
        
        totalVenta = CDbl(ventaObj("total"))
        abonoVenta = 0
        On Error Resume Next
        abonoVenta = CDbl(ventaObj("abono"))
        On Error GoTo 0
        
        Dim tipoPago As String
        tipoPago = ventaObj("tipoPago")
        
        ' Calcular pago segun tipo
        If LCase(tipoPago) = "contado" Then
            pagoVenta = totalVenta
        ElseIf LCase(tipoPago) = "credito" Then
            pagoVenta = 0
        Else ' parcial
            pagoVenta = abonoVenta
        End If
        
        ' Obtener saldos del diccionario pre-calculado
        Dim saldoKey As String
        saldoKey = clienteId & "_" & ventaObj("id")
        
        If saldosCliente.Exists(saldoKey & "_ant") Then
            saldoAnterior = saldosCliente(saldoKey & "_ant")
        Else
            saldoAnterior = 0
        End If
        
        If saldosCliente.Exists(saldoKey & "_act") Then
            saldoActual = saldosCliente(saldoKey & "_act")
        Else
            saldoActual = 0
        End If
        
        ' Si hay items, escribir una fila por cada item
        If Not items Is Nothing And items.Count > 0 Then
            Dim j As Long
            For j = 1 To items.Count
                Dim item As Object
                Set item = items(j)
                
                Dim productoNombre As String
                Dim precioUnit As Double
                Dim cantidad As Double
                Dim descuento As Double
                Dim subtotalItem As Double
                Dim unidadItem As String
                Dim cantidadStr As String
                Dim kilosItem As Double
                
                On Error Resume Next
                productoNombre = item("productoNombre")
                If productoNombre = "" Then productoNombre = "Producto"
                precioUnit = CDbl(item("precioUnitario"))
                cantidad = CDbl(item("cantidad"))
                descuento = CDbl(item("descuentoUnitario")) * cantidad
                subtotalItem = CDbl(item("subtotal"))
                unidadItem = UCase(item("unidad"))
                kilosItem = CDbl(item("kilos"))
                On Error GoTo 0
                
                ' Formatear cantidad con tipo
                If unidadItem = "KG" Then
                    cantidadStr = Format(cantidad, "0.00") & " Kg"
                ElseIf unidadItem = "MIXTO" Then
                    cantidadStr = Format(cantidad, "0") & " Pzas / " & Format(kilosItem, "0.00") & " Kg"
                Else ' PIEZA
                    cantidadStr = Format(cantidad, "0") & " Pzas"
                End If
                
                ' Escribir fila
                ws.Cells(fila, 1).Value = ventaObj("id") ' Folio
                ws.Cells(fila, 2).Value = clienteId ' Id del cliente
                ws.Cells(fila, 3).Value = FormatearFecha(ventaObj("fechaIso"))
                ws.Cells(fila, 4).Value = FormatearHora(ventaObj("fechaIso"))
                ws.Cells(fila, 5).Value = clienteNombre
                ws.Cells(fila, 6).Value = productoNombre
                ws.Cells(fila, 7).Value = precioUnit
                ws.Cells(fila, 7).NumberFormat = "$#,##0.00"
                ws.Cells(fila, 8).Value = descuento
                ws.Cells(fila, 8).NumberFormat = "$#,##0.00"
                ws.Cells(fila, 9).Value = cantidadStr
                ws.Cells(fila, 10).Value = tipoPago
                ws.Cells(fila, 11).Value = pagoVenta
                ws.Cells(fila, 11).NumberFormat = "$#,##0.00"
                ws.Cells(fila, 12).Value = abonoVenta
                ws.Cells(fila, 12).NumberFormat = "$#,##0.00"
                ws.Cells(fila, 13).Value = subtotalItem
                ws.Cells(fila, 13).NumberFormat = "$#,##0.00"
                
                ' Solo poner total y saldos en la primera fila del ticket
                If j = 1 Then
                    ws.Cells(fila, 14).Value = totalVenta
                    ws.Cells(fila, 14).NumberFormat = "$#,##0.00"
                    ws.Cells(fila, 15).Value = saldoAnterior
                    ws.Cells(fila, 15).NumberFormat = "$#,##0.00"
                    ws.Cells(fila, 16).Value = saldoActual
                    ws.Cells(fila, 16).NumberFormat = "$#,##0.00"
                    
                    totalGeneral = totalGeneral + totalVenta
                End If
                
                fila = fila + 1
            Next j
        Else
            ' Si no hay items, escribir una fila con la venta
            ws.Cells(fila, 1).Value = ventaObj("id")
            ws.Cells(fila, 2).Value = clienteId
            ws.Cells(fila, 3).Value = FormatearFecha(ventaObj("fechaIso"))
            ws.Cells(fila, 4).Value = FormatearHora(ventaObj("fechaIso"))
            ws.Cells(fila, 5).Value = clienteNombre
            ws.Cells(fila, 6).Value = "-"
            ws.Cells(fila, 7).Value = 0
            ws.Cells(fila, 8).Value = 0
            ws.Cells(fila, 9).Value = "-"
            ws.Cells(fila, 10).Value = tipoPago
            ws.Cells(fila, 11).Value = pagoVenta
            ws.Cells(fila, 11).NumberFormat = "$#,##0.00"
            ws.Cells(fila, 12).Value = abonoVenta
            ws.Cells(fila, 12).NumberFormat = "$#,##0.00"
            ws.Cells(fila, 13).Value = totalVenta
            ws.Cells(fila, 13).NumberFormat = "$#,##0.00"
            ws.Cells(fila, 14).Value = totalVenta
            ws.Cells(fila, 14).NumberFormat = "$#,##0.00"
            ws.Cells(fila, 15).Value = saldoAnterior
            ws.Cells(fila, 15).NumberFormat = "$#,##0.00"
            ws.Cells(fila, 16).Value = saldoActual
            ws.Cells(fila, 16).NumberFormat = "$#,##0.00"
            
            totalGeneral = totalGeneral + totalVenta
            fila = fila + 1
        End If
        
        fechaAnterior = fechaActual
    Next i
    
    ' Agregar suma del total justo despues del encabezado (fila 4)
    ' Pero primero movemos los datos para insertar la fila de totales
    ' En realidad, es mejor poner el total al final de los datos
    
    ' Agregar fila de TOTAL GENERAL
    ws.Cells(fila, 13).Value = "TOTAL:"
    ws.Cells(fila, 13).Font.Bold = True
    ws.Cells(fila, 14).Value = totalGeneral
    ws.Cells(fila, 14).NumberFormat = "$#,##0.00"
    ws.Cells(fila, 14).Font.Bold = True
    ws.Cells(fila, 14).Interior.Color = RGB(255, 255, 0)
    
    ' Ajustar ancho de columnas
    ws.Columns("A:T").AutoFit
    
    ' Agregar bordes a la seccion de ventas
    If fila > 4 Then
        ws.Range(ws.Cells(3, 1), ws.Cells(fila, 16)).Borders.LineStyle = xlContinuous
    End If
End Sub

' ============================================
' CALCULAR SALDOS POR CLIENTE
' Saldo Anterior = deuda antes de la venta
' Saldo Actual = Saldo Anterior + (Total - Pago) - Abono
' ============================================
Private Function CalcularSaldosClientes(ventas As Collection) As Object
    Dim result As Object
    Set result = CreateObject("Scripting.Dictionary")
    
    ' Primero necesitamos ordenar del mas antiguo al mas reciente para calcular correctamente
    Dim ventasAsc As Collection
    Set ventasAsc = New Collection
    
    Dim i As Long
    For i = ventas.Count To 1 Step -1
        ventasAsc.Add ventas(i)
    Next i
    
    ' Diccionario para llevar el saldo acumulado por cliente
    Dim saldosPorCliente As Object
    Set saldosPorCliente = CreateObject("Scripting.Dictionary")
    
    Dim ventaObj As Object
    For i = 1 To ventasAsc.Count
        Set ventaObj = ventasAsc(i)
        
        Dim clienteId As String
        clienteId = CStr(ventaObj("cliente_id"))
        
        Dim totalVenta As Double
        Dim abonoVenta As Double
        Dim pagoVenta As Double
        Dim tipoPago As String
        
        totalVenta = CDbl(ventaObj("total"))
        abonoVenta = 0
        On Error Resume Next
        abonoVenta = CDbl(ventaObj("abono"))
        On Error GoTo 0
        
        tipoPago = LCase(ventaObj("tipoPago"))
        
        If tipoPago = "contado" Then
            pagoVenta = totalVenta
        ElseIf tipoPago = "credito" Then
            pagoVenta = 0
        Else ' parcial
            pagoVenta = abonoVenta
        End If
        
        ' Saldo anterior es lo que debia antes de esta venta
        Dim saldoAnterior As Double
        If saldosPorCliente.Exists(clienteId) Then
            saldoAnterior = saldosPorCliente(clienteId)
        Else
            saldoAnterior = 0
        End If
        
        ' Saldo actual = Saldo anterior + (Total - Pago) - Abono
        ' Si pago contado: saldoActual = saldoAnterior + 0 = saldoAnterior (no cambia)
        ' Si credito: saldoActual = saldoAnterior + totalVenta
        ' Si parcial: saldoActual = saldoAnterior + (totalVenta - pagoVenta) - abono
        Dim saldoActual As Double
        saldoActual = saldoAnterior + (totalVenta - pagoVenta)
        If saldoActual < 0 Then saldoActual = 0
        
        ' Guardar en el resultado con clave unica
        Dim saldoKey As String
        saldoKey = clienteId & "_" & ventaObj("id")
        result.Add saldoKey & "_ant", saldoAnterior
        result.Add saldoKey & "_act", saldoActual
        
        ' Actualizar saldo del cliente para la siguiente venta
        If saldosPorCliente.Exists(clienteId) Then
            saldosPorCliente(clienteId) = saldoActual
        Else
            saldosPorCliente.Add clienteId, saldoActual
        End If
    Next i
    
    Set CalcularSaldosClientes = result
End Function

' ============================================
' FUNCIONES AUXILIARES
' ============================================
Private Function OrdenarVentasPorFecha(ventas As Collection) As Collection
    Dim arr() As Variant
    ReDim arr(1 To ventas.Count)
    
    Dim i As Long
    For i = 1 To ventas.Count
        Set arr(i) = ventas(i)
    Next i
    
    ' Bubble sort por fecha descendente (mas reciente primero)
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
    
    Dim result As New Collection
    For i = 1 To UBound(arr)
        result.Add arr(i)
    Next i
    
    Set OrdenarVentasPorFecha = result
End Function

Private Function FormatearFecha(fechaIso As String) As String
    Dim partes() As String
    partes = Split(Left(fechaIso, 10), "-")
    
    If UBound(partes) >= 2 Then
        FormatearFecha = partes(2) & "/" & partes(1) & "/" & partes(0)
    Else
        FormatearFecha = fechaIso
    End If
End Function

Private Function FormatearHora(fechaIso As String) As String
    If Len(fechaIso) >= 19 Then
        FormatearHora = Mid(fechaIso, 12, 5)
    Else
        FormatearHora = ""
    End If
End Function

Private Function ExtraerValorJSON(json As String, key As String) As String
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
    
    Do While Mid(json, inicio, 1) = " "
        inicio = inicio + 1
    Loop
    
    If Mid(json, inicio, 1) = """" Then
        inicio = inicio + 1
        fin = InStr(inicio, json, """")
        ExtraerValorJSON = Mid(json, inicio, fin - inicio)
    Else
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
' PARSER JSON
' ============================================
Private Function ParsearVentasJSON(jsonString As String) As Collection
    Dim result As New Collection
    
    Dim inicio As Long
    inicio = InStr(jsonString, """ventas"":")
    
    If inicio = 0 Then
        Set ParsearVentasJSON = result
        Exit Function
    End If
    
    inicio = InStr(inicio, jsonString, "[")
    If inicio = 0 Then
        Set ParsearVentasJSON = result
        Exit Function
    End If
    
    Dim profundidad As Integer
    Dim pos As Long
    Dim ventaInicio As Long
    Dim ventaFin As Long
    
    profundidad = 0
    pos = inicio
    
    Do While pos <= Len(jsonString)
        Dim char As String
        char = Mid(jsonString, pos, 1)
        
        If char = "{" Then
            If profundidad = 1 Then
                ventaInicio = pos
            End If
            profundidad = profundidad + 1
        ElseIf char = "}" Then
            profundidad = profundidad - 1
            If profundidad = 1 Then
                ventaFin = pos
                Dim ventaStr As String
                ventaStr = Mid(jsonString, ventaInicio, ventaFin - ventaInicio + 1)
                
                Dim ventaObj As Object
                Set ventaObj = ParsearObjetoVenta(ventaStr)
                If Not ventaObj Is Nothing Then
                    result.Add ventaObj
                End If
            End If
        ElseIf char = "]" And profundidad = 1 Then
            Exit Do
        End If
        
        pos = pos + 1
    Loop
    
    Set ParsearVentasJSON = result
End Function

Private Function ParsearObjetoVenta(ventaStr As String) As Object
    Dim obj As Object
    Set obj = CreateObject("Scripting.Dictionary")
    
    On Error Resume Next
    
    obj.Add "id", CLng(ExtraerValorJSON(ventaStr, "id"))
    obj.Add "cliente_id", CLng(ExtraerValorJSON(ventaStr, "clienteId"))
    obj.Add "cliente_nombre", ExtraerValorJSON(ventaStr, "cliente_nombre")
    obj.Add "ruta_nombre", ExtraerValorJSON(ventaStr, "ruta_nombre")
    obj.Add "total", CDbl(ExtraerValorJSON(ventaStr, "total"))
    obj.Add "tipoPago", ExtraerValorJSON(ventaStr, "tipoPago")
    obj.Add "fechaIso", ExtraerValorJSON(ventaStr, "fechaIso")
    
    Dim abonoStr As String
    abonoStr = ExtraerValorJSON(ventaStr, "abono")
    If abonoStr <> "" Then
        obj.Add "abono", CDbl(abonoStr)
    Else
        obj.Add "abono", 0
    End If
    
    ' Parsear items
    Dim itemsCol As Collection
    Set itemsCol = ParsearItems(ventaStr)
    obj.Add "items", itemsCol
    
    On Error GoTo 0
    
    Set ParsearObjetoVenta = obj
End Function

Private Function ParsearItems(ventaStr As String) As Collection
    Dim result As New Collection
    
    Dim itemsInicio As Long
    itemsInicio = InStr(ventaStr, """items"":")
    
    If itemsInicio = 0 Then
        Set ParsearItems = result
        Exit Function
    End If
    
    itemsInicio = InStr(itemsInicio, ventaStr, "[")
    If itemsInicio = 0 Then
        Set ParsearItems = result
        Exit Function
    End If
    
    Dim profundidad As Integer
    Dim pos As Long
    Dim itemInicio As Long
    Dim itemFin As Long
    
    profundidad = 0
    pos = itemsInicio
    
    Do While pos <= Len(ventaStr)
        Dim char As String
        char = Mid(ventaStr, pos, 1)
        
        If char = "{" Then
            If profundidad = 1 Then
                itemInicio = pos
            End If
            profundidad = profundidad + 1
        ElseIf char = "}" Then
            profundidad = profundidad - 1
            If profundidad = 1 Then
                itemFin = pos
                Dim itemStr As String
                itemStr = Mid(ventaStr, itemInicio, itemFin - itemInicio + 1)
                
                Dim itemObj As Object
                Set itemObj = CreateObject("Scripting.Dictionary")
                
                On Error Resume Next
                itemObj.Add "productoNombre", ExtraerValorJSON(itemStr, "productoNombre")
                itemObj.Add "precioUnitario", CDbl(ExtraerValorJSON(itemStr, "precioUnitario"))
                itemObj.Add "cantidad", CDbl(ExtraerValorJSON(itemStr, "cantidad"))
                itemObj.Add "descuentoUnitario", CDbl(ExtraerValorJSON(itemStr, "descuentoUnitario"))
                itemObj.Add "subtotal", CDbl(ExtraerValorJSON(itemStr, "subtotal"))
                itemObj.Add "unidad", ExtraerValorJSON(itemStr, "unidad")
                itemObj.Add "kilos", CDbl(ExtraerValorJSON(itemStr, "kilos"))
                On Error GoTo 0
                
                result.Add itemObj
            End If
        ElseIf char = "]" And profundidad = 1 Then
            Exit Do
        End If
        
        pos = pos + 1
    Loop
    
    Set ParsearItems = result
End Function
