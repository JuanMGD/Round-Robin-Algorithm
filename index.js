const msj = document.querySelector('#msj');
const registroInicial = document.querySelector('#registroInicial');
const reinicio = document.querySelector('#reinicio');
const recorrido = document.querySelector('#recorrido');
const operaciones = document.querySelector('#operaciones');
const datosProceso = document.querySelector('#datosProceso');
const txtNombre = document.querySelector('#txtNombre');
const txtTi = document.querySelector('#txtTi');
const txtT = document.querySelector('#txtT');
const datosQuantum = document.querySelector('#datosQuantum');
const txtQ = document.querySelector('#txtQ');
const valorQuantum = document.querySelector('#valorQuantum');
const btnReiniciar = document.querySelector('#btnReiniciar');
const cabeceraTabla = document.querySelector('#cabeceraTabla');
const cuerpoTabla = document.querySelector('#cuerpoTabla');
const filaProcesos = document.querySelector('#proceso');
const filaTiempos = document.querySelector('#tiempo');
const filaRestantes = document.querySelector('#proceso-restante');
const contenedorGantt = document.querySelector('#contenedorGantt');
const diagrama = document.querySelector('#diagrama');

let procesos = [];

let q = 0;

let tiempoActual = 0;
let tiempoAnterior = 0;
let procesosPendientes = [];
let procesosTerminados = [];
let procesosPendientesDeLlegar;
let cuenta = 0;
let ejecucionesProcesos = new Map();

// Obtiene el proceso con el cual se debe comenzar
const obtenerProcesoInicial = () => {
    let primerProceso = procesos[0];
    procesos.forEach(proceso => {
        if(proceso.ti < primerProceso.ti) primerProceso = proceso;
        
        else if(proceso.ti === primerProceso.ti && proceso.t < primerProceso.t) primerProceso = proceso;
    });

    procesosPendientesDeLlegar = procesosPendientesDeLlegar.filter(proceso => proceso.nombre !== primerProceso.nombre);

    agregarProcesoDiagrama(primerProceso);

    return primerProceso;
}

const agregarProcesoDiagrama = proceso => {
    ejecucionesProcesos.set(proceso.nombre, 0);
    let tr = document.createElement('tr');
    tr.setAttribute('id', `gantt${proceso.nombre}`);
    diagrama.appendChild(tr);
}

const agregarBloqueProcesoDiagrama = nombre => {
    const filaProceso = document.getElementById(`gantt${nombre}`);
    const cuentaProceso = ejecucionesProcesos.get(nombre);
    const nuevaCuentaProceso = cuenta;
    const longitudCeldaRelleno = cuenta - 1 - cuentaProceso;
    
    if (cuenta > 1 && longitudCeldaRelleno > 0) {
        const celdaRelleno = document.createElement('td');
        celdaRelleno.setAttribute('colspan', longitudCeldaRelleno);
        celdaRelleno.setAttribute('class', 'table-dark');
        filaProceso.appendChild(celdaRelleno);
    }
    
    const celdaLetra = document.createElement('td');
    celdaLetra.textContent = nombre;
    filaProceso.appendChild(celdaLetra);
    ejecucionesProcesos.set(nombre, nuevaCuentaProceso);
}


// Ordena los procesos por tiempo de inicio y tiempo de ejecución entre cada iteración
const ordenarProcesos = (a, b) => {
    // Si el ti del primer proceso es menor al del segundo se coloca primero 
    if(a.ti < b.ti) return -1;
    // Si el ti del primer proceso es mayor al del segundo se coloca atrás del segundo 
    if(a.ti > b.ti) return 1;
    // De otro modo son iguales y hay que buscar al de tiempo de ejecución menor 
    // el tiempo de ejecución de a es menor al de b
    if(a.t < b.t) return -1;
    // el tiempo de ejecución de a es mayor al de b
    if(a.t > b.t) return 1;

    return 0; 
}

// Verifica que no exista otro proceso con el mismo nombre
const existeProceso = nombre => {
    const busqueda = procesos.find(proceso => proceso.nombre === nombre);
    return busqueda !== undefined;
}

// Busca los procesos que acaban de llegar
const obtenerProcesosEntrantes = () => {
    let procesosEntrantes = [];

    procesosPendientesDeLlegar.sort(ordenarProcesos).forEach(proceso => {
        if(proceso.ti > tiempoAnterior && proceso.ti <= tiempoActual) {
            procesosEntrantes.push(proceso);
            procesosPendientes.push(proceso);
            agregarProcesoDiagrama(proceso);
        }
    });
    
    procesosPendientesDeLlegar = procesosPendientesDeLlegar.filter( proceso => !procesosEntrantes.includes(proceso) );
}

// Crea una fila con la info del proceso una vez que se valida su información
const agregarProcesoTabla = (proceso) => {
    let tr = document.createElement('tr');
    tr.innerHTML = `<td>${proceso.nombre}</td><td>${proceso.ti}</td><td>${proceso.t}</td>`;
    tr.setAttribute('id', `proceso${proceso.nombre}`);
    cuerpoTabla.appendChild(tr);
}

// Agrega los cáculos finales a la tabla de procesos (T, E, I)
const agregarCalculosFinales = () => {
    cabeceraTabla.innerHTML += '<th>tf</th><th>T</th><th>E</th><th>I</th>';
    procesosTerminados.forEach(proceso => {
        let T = proceso.tf - proceso.ti;
        let E = T - proceso.t;
        let I = `${proceso.t}/${T}`;
        let tr = document.getElementById(`proceso${proceso.nombre}`);
        tr.innerHTML += `<td>${proceso.tf}</td><td>${T}</td><td>${E}</td><td>${I}</td>`;
    });
}

// Agrega cada paso a la tabla del recorrido
const agregarProcesoAlRecorrido = (proceso, tiempo, recorridoTerminado) => {
    setTimeout(() => {
        filaProcesos.innerHTML += `<td ${recorridoTerminado ?'class="table-info"' : ''}>${proceso}</td>`;
        filaTiempos.innerHTML += `<td>${tiempo}</td>`; 
    }, 250 * cuenta);
}

// Agrega las operaciones a la tabla de operaciones
const agregarCantidadRestanteDelProceso = (proceso, cantidad) => {
    setTimeout(() => {
        filaRestantes.innerHTML += `<td class="table-warning">${proceso}:${cantidad}</td>`;
    }, 250 * cuenta);
}

// Obtiene el tiempo de ejecución original, ya que con las iteraciones se va restando
const obtenerTOriginal = (nombreProceso) => {
    let proceso = procesos.find(proceso => proceso.nombre === nombreProceso);
    return proceso.t;
}


datosProceso.addEventListener('submit', e => {
    e.preventDefault();
    // Realiza las validaciones de los datos de los procesos
    if(txtNombre.value.trim() === '') {
        msj.classList.remove('d-none')
        return msj.innerHTML = 'Debe colocarle un nombre al proceso';
    }
    
    if(txtTi.value.trim() === '' || isNaN(parseFloat(txtTi.value))) {
        msj.classList.remove('d-none')
        return msj.innerHTML = 'Debe colocar una cantidad válida en tiempo de inicio';
    }

    if(txtT.value.trim() === '' || isNaN(parseFloat(txtT.value))) {
        msj.classList.remove('d-none')
        return msj.innerHTML = 'Debe colocar una cantidad válida en tiempo de ejecución';
    }

    if (existeProceso(txtNombre.value)) {
        msj.classList.remove('d-none')
        return msj.innerHTML = 'El nombre ya está usado por otro proceso, cambie el nombre';
    }
    
    msj.classList.add('d-none');
    
    const proceso = {
        nombre: txtNombre.value,
        ti: parseFloat(txtTi.value),
        t: parseFloat(txtT.value),
    }

    // Agrega el proceso al arreglo
    procesos.push(proceso);
    // Agrega una fila a la tabla con la info del proceso
    agregarProcesoTabla(proceso);
});

const roundRobin = () => {
    // Coloca el valor de q
    valorQuantum.textContent = `Quantum = ${q}`;
    // Inicializa la tabla del recorrido del procesador
    agregarProcesoAlRecorrido('', tiempoActual, false);

    let primerProceso = obtenerProcesoInicial();
    procesosPendientes.push(primerProceso);

    while(procesosPendientes.length > 0) {
        let procesoActual = {...procesosPendientes[0]};
        tiempoAnterior = tiempoActual; 
        agregarCantidadRestanteDelProceso(procesoActual.nombre, procesoActual.t);

        // Si el tiempo del proceso actual es mayor que "q" suma y resta el valor del quantum
        if(procesoActual.t > q) {
            tiempoActual += q;
            procesoActual.t -= q;
            obtenerProcesosEntrantes();
            procesosPendientes.push({...procesoActual});
        }
        // Si el tiempo del proceso actual es menor o igual que "q" suma y resta lo que quede del tiempo del proceso
        else {
            tiempoActual += procesoActual.t;
            procesoActual.t -= procesoActual.t;
            procesosTerminados.push({...procesoActual, t: obtenerTOriginal(procesoActual.nombre), tf: parseFloat(tiempoActual)});
            obtenerProcesosEntrantes();
        } 
        // Agrega los calculos del proceso actual
        agregarProcesoAlRecorrido(procesoActual.nombre, tiempoActual, procesoActual.t === 0);

        // Elimina el primer elemento 
        procesosPendientes.shift();
        // Lleva la cuenta de las iteraciones
        cuenta++;
        
        // Añade un nuevo espacio al diagrama de Gantt
        agregarBloqueProcesoDiagrama(procesoActual.nombre);
    }

    agregarCalculosFinales();
}


datosQuantum.addEventListener('submit', e => {
    e.preventDefault();
    // Realiza las validaciones respecto al valor de q
    if(txtQ.value.trim() === '' || isNaN(parseFloat(txtQ.value))) {
        msj.classList.remove('d-none')
        return msj.innerHTML = 'Debe colocar una cantidad válida en Quantum';
    }

    if(procesos.length === 0) {
        msj.classList.remove('d-none')
        return msj.innerHTML = 'Debe agregar algún proceso primero';
    }
    
    msj.classList.add('d-none');

    q = parseFloat(txtQ.value);
    procesosPendientesDeLlegar = [...procesos];

    // Oculta el formulario inicial
    registroInicial.classList.add('d-none');
    // Muestra las gráficas para los resultados
    reinicio.classList.remove('d-none');
    recorrido.classList.remove('d-none');
    operaciones.classList.remove('d-none');
    contenedorGantt.classList.remove('d-none');

    // Ejecuta el proceso
    roundRobin();
});

// Reinicia la página
btnReiniciar.addEventListener('click', () => location.reload());