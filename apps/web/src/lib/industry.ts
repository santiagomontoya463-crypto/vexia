"use client";

import { useAuth } from "./auth/AuthProvider";

/**
 * Vocabulario y sugerencias según el tipo de negocio.
 * Cada empresa ve su propio lenguaje (pacientes y citas, técnicos y órdenes de
 * servicio, estudiantes y clases, etc.) sin cambiar cómo funciona la aplicación.
 */

export type SuggestedService = {
  name: string;
  category: string;
  duration: string;
};

export type IndustryProfile = {
  type: string;
  client: string;
  clients: string;
  newClient: string;
  reservation: string;
  reservations: string;
  newReservation: string;
  service: string;
  services: string;
  newService: string;
  worker: string;
  workers: string;
  newWorker: string;
  addWorker: string;
  product: string;
  products: string;
  skillsLabel: string;
  workerRoles: string[];
  serviceCategories: string[];
  suggestedServices: SuggestedService[];
};

const BASE: Omit<IndustryProfile, "type"> = {
  client: "Cliente",
  clients: "Clientes",
  newClient: "Nuevo cliente",
  reservation: "Reserva",
  reservations: "Reservas",
  newReservation: "Nueva reserva",
  service: "Servicio",
  services: "Servicios",
  newService: "Nuevo servicio",
  worker: "Trabajador",
  workers: "Trabajadores",
  newWorker: "Nuevo trabajador",
  addWorker: "Agregar trabajador",
  product: "Producto",
  products: "Productos",
  skillsLabel: "Servicios que puede realizar",
  workerRoles: ["Trabajador", "Asistente", "Supervisor", "Administrador"],
  serviceCategories: ["General", "Atención", "Asesoría", "Soporte"],
  suggestedServices: [],
};

function profile(
  type: string,
  overrides: Partial<Omit<IndustryProfile, "type">>,
): IndustryProfile {
  return { ...BASE, ...overrides, type };
}

const PROFILES: IndustryProfile[] = [
  profile("Belleza y bienestar", {
    worker: "Profesional",
    workers: "Profesionales",
    newWorker: "Nuevo profesional",
    addWorker: "Agregar profesional",
    reservation: "Cita",
    reservations: "Citas",
    newReservation: "Nueva cita",
    skillsLabel: "Servicios que puede realizar",
    workerRoles: ["Estilista", "Barbero", "Manicurista", "Masajista", "Esteticista", "Recepcionista", "Administrador"],
    serviceCategories: ["Cabello", "Barba", "Uñas", "Estética facial", "Masajes", "Depilación", "Maquillaje", "Spa"],
    suggestedServices: [
      { name: "Corte de cabello", category: "Cabello", duration: "30 min" },
      { name: "Arreglo de barba", category: "Barba", duration: "20 min" },
      { name: "Manicure", category: "Uñas", duration: "45 min" },
      { name: "Masaje relajante", category: "Masajes", duration: "60 min" },
    ],
  }),
  profile("Salud", {
    client: "Paciente",
    clients: "Pacientes",
    newClient: "Nuevo paciente",
    reservation: "Cita",
    reservations: "Citas",
    newReservation: "Nueva cita",
    worker: "Profesional",
    workers: "Profesionales",
    newWorker: "Nuevo profesional",
    addWorker: "Agregar profesional",
    skillsLabel: "Especialidades y servicios que atiende",
    workerRoles: ["Médico", "Odontólogo", "Terapeuta", "Psicólogo", "Enfermero/a", "Auxiliar", "Recepcionista", "Administrador"],
    serviceCategories: ["Consulta", "Terapia", "Examen", "Procedimiento", "Odontología", "Vacunación", "Control"],
    suggestedServices: [
      { name: "Consulta general", category: "Consulta", duration: "30 min" },
      { name: "Terapia física", category: "Terapia", duration: "45 min" },
      { name: "Control de seguimiento", category: "Control", duration: "20 min" },
      { name: "Toma de examen", category: "Examen", duration: "15 min" },
    ],
  }),
  profile("Droguería y farmacia", {
    reservation: "Pedido",
    reservations: "Pedidos",
    newReservation: "Nuevo pedido",
    worker: "Colaborador",
    workers: "Colaboradores",
    newWorker: "Nuevo colaborador",
    addWorker: "Agregar colaborador",
    product: "Medicamento o producto",
    products: "Medicamentos y productos",
    skillsLabel: "Servicios que puede atender",
    workerRoles: ["Regente de farmacia", "Auxiliar de droguería", "Cajero", "Domiciliario", "Administrador"],
    serviceCategories: ["Inyectología", "Toma de presión", "Domicilios", "Asesoría farmacéutica"],
    suggestedServices: [
      { name: "Inyectología", category: "Inyectología", duration: "10 min" },
      { name: "Toma de tensión arterial", category: "Toma de presión", duration: "10 min" },
      { name: "Domicilio", category: "Domicilios", duration: "45 min" },
    ],
  }),
  profile("Comercio / tienda", {
    reservation: "Pedido",
    reservations: "Pedidos",
    newReservation: "Nuevo pedido",
    worker: "Colaborador",
    workers: "Colaboradores",
    newWorker: "Nuevo colaborador",
    addWorker: "Agregar colaborador",
    skillsLabel: "Servicios que puede atender",
    workerRoles: ["Vendedor", "Cajero", "Bodeguero", "Domiciliario", "Administrador"],
    serviceCategories: ["Entrega a domicilio", "Instalación", "Garantía y soporte", "Asesoría"],
    suggestedServices: [
      { name: "Entrega a domicilio", category: "Entrega a domicilio", duration: "60 min" },
      { name: "Armado e instalación", category: "Instalación", duration: "90 min" },
      { name: "Gestión de garantía", category: "Garantía y soporte", duration: "30 min" },
    ],
  }),
  profile("Restaurante o cafetería", {
    reservation: "Reserva",
    reservations: "Reservas",
    worker: "Colaborador",
    workers: "Colaboradores",
    newWorker: "Nuevo colaborador",
    addWorker: "Agregar colaborador",
    skillsLabel: "Áreas donde puede trabajar",
    workerRoles: ["Mesero", "Cocinero", "Barista", "Cajero", "Domiciliario", "Administrador"],
    serviceCategories: ["Reserva de mesa", "Eventos", "Catering", "Domicilios"],
    suggestedServices: [
      { name: "Reserva de mesa", category: "Reserva de mesa", duration: "90 min" },
      { name: "Evento privado", category: "Eventos", duration: "180 min" },
      { name: "Catering por encargo", category: "Catering", duration: "120 min" },
    ],
  }),
  profile("Servicios profesionales", {
    reservation: "Cita",
    reservations: "Citas",
    newReservation: "Nueva cita",
    worker: "Profesional",
    workers: "Profesionales",
    newWorker: "Nuevo profesional",
    addWorker: "Agregar profesional",
    skillsLabel: "Servicios que puede prestar",
    workerRoles: ["Consultor", "Abogado", "Contador", "Asesor", "Asistente", "Administrador"],
    serviceCategories: ["Asesoría", "Consultoría", "Gestión documental", "Representación"],
    suggestedServices: [
      { name: "Asesoría inicial", category: "Asesoría", duration: "60 min" },
      { name: "Sesión de consultoría", category: "Consultoría", duration: "90 min" },
    ],
  }),
  profile("Educación y formación", {
    client: "Estudiante",
    clients: "Estudiantes",
    newClient: "Nuevo estudiante",
    reservation: "Clase",
    reservations: "Clases",
    newReservation: "Nueva clase",
    service: "Curso",
    services: "Cursos",
    newService: "Nuevo curso",
    worker: "Docente",
    workers: "Docentes",
    newWorker: "Nuevo docente",
    addWorker: "Agregar docente",
    skillsLabel: "Cursos que puede dictar",
    workerRoles: ["Docente", "Instructor", "Coordinador", "Secretaría", "Administrador"],
    serviceCategories: ["Clase individual", "Curso grupal", "Taller", "Tutoría"],
    suggestedServices: [
      { name: "Clase individual", category: "Clase individual", duration: "60 min" },
      { name: "Taller grupal", category: "Taller", duration: "120 min" },
    ],
  }),
  profile("Hotelería y turismo", {
    client: "Huésped",
    clients: "Huéspedes",
    newClient: "Nuevo huésped",
    reservation: "Reserva",
    reservations: "Reservas",
    worker: "Colaborador",
    workers: "Colaboradores",
    newWorker: "Nuevo colaborador",
    addWorker: "Agregar colaborador",
    skillsLabel: "Servicios que puede atender",
    workerRoles: ["Recepcionista", "Camarero/a", "Guía turístico", "Conductor", "Administrador"],
    serviceCategories: ["Alojamiento", "Tours y actividades", "Transporte", "Alimentación"],
    suggestedServices: [
      { name: "Habitación doble", category: "Alojamiento", duration: "1 noche" },
      { name: "Tour guiado", category: "Tours y actividades", duration: "180 min" },
      { name: "Traslado al aeropuerto", category: "Transporte", duration: "60 min" },
    ],
  }),
  profile("Tecnología", {
    reservation: "Solicitud",
    reservations: "Solicitudes",
    newReservation: "Nueva solicitud",
    worker: "Técnico",
    workers: "Técnicos",
    newWorker: "Nuevo técnico",
    addWorker: "Agregar técnico",
    skillsLabel: "Trabajos que puede realizar",
    workerRoles: ["Técnico de soporte", "Desarrollador", "Analista", "Coordinador", "Administrador"],
    serviceCategories: ["Soporte técnico", "Desarrollo", "Redes", "Mantenimiento de equipos"],
    suggestedServices: [
      { name: "Soporte técnico remoto", category: "Soporte técnico", duration: "30 min" },
      { name: "Mantenimiento de equipo", category: "Mantenimiento de equipos", duration: "60 min" },
    ],
  }),
  profile("Telecomunicaciones y técnicos", {
    reservation: "Orden de servicio",
    reservations: "Órdenes de servicio",
    newReservation: "Nueva orden de servicio",
    worker: "Técnico",
    workers: "Técnicos",
    newWorker: "Nuevo técnico",
    addWorker: "Agregar técnico",
    skillsLabel: "Trabajos que puede realizar",
    workerRoles: ["Técnico instalador", "Técnico de reparaciones", "Coordinador de campo", "Soporte", "Administrador"],
    serviceCategories: ["Instalación", "Reparación", "Mantenimiento", "Soporte técnico", "Visita técnica"],
    suggestedServices: [
      { name: "Instalación de internet", category: "Instalación", duration: "90 min" },
      { name: "Reparación de equipo", category: "Reparación", duration: "60 min" },
      { name: "Visita técnica", category: "Visita técnica", duration: "45 min" },
      { name: "Cambio de equipo", category: "Mantenimiento", duration: "45 min" },
    ],
  }),
  profile("Taller automotriz", {
    reservation: "Orden de trabajo",
    reservations: "Órdenes de trabajo",
    newReservation: "Nueva orden de trabajo",
    worker: "Mecánico",
    workers: "Mecánicos",
    newWorker: "Nuevo mecánico",
    addWorker: "Agregar mecánico",
    skillsLabel: "Trabajos que puede realizar",
    workerRoles: ["Mecánico", "Electricista automotriz", "Latonero y pintor", "Recepcionista", "Administrador"],
    serviceCategories: ["Mantenimiento", "Frenos", "Motor", "Eléctrico", "Alineación y balanceo", "Lavado"],
    suggestedServices: [
      { name: "Cambio de aceite", category: "Mantenimiento", duration: "45 min" },
      { name: "Alineación y balanceo", category: "Alineación y balanceo", duration: "60 min" },
      { name: "Revisión de frenos", category: "Frenos", duration: "60 min" },
    ],
  }),
  profile("Mantenimiento y servicios del hogar", {
    reservation: "Orden de servicio",
    reservations: "Órdenes de servicio",
    newReservation: "Nueva orden de servicio",
    worker: "Técnico",
    workers: "Técnicos",
    newWorker: "Nuevo técnico",
    addWorker: "Agregar técnico",
    skillsLabel: "Trabajos que puede realizar",
    workerRoles: ["Técnico", "Electricista", "Plomero", "Coordinador", "Administrador"],
    serviceCategories: ["Plomería", "Electricidad", "Cerrajería", "Aseo", "Jardinería", "Pintura"],
    suggestedServices: [
      { name: "Visita de diagnóstico", category: "General", duration: "45 min" },
      { name: "Reparación eléctrica", category: "Electricidad", duration: "90 min" },
      { name: "Destape de tuberías", category: "Plomería", duration: "60 min" },
    ],
  }),
  profile("Veterinaria y mascotas", {
    reservation: "Cita",
    reservations: "Citas",
    newReservation: "Nueva cita",
    worker: "Profesional",
    workers: "Profesionales",
    newWorker: "Nuevo profesional",
    addWorker: "Agregar profesional",
    skillsLabel: "Servicios que puede realizar",
    workerRoles: ["Veterinario", "Auxiliar veterinario", "Peluquero canino", "Recepcionista", "Administrador"],
    serviceCategories: ["Consulta", "Vacunación", "Baño y peluquería", "Cirugía", "Hospedaje"],
    suggestedServices: [
      { name: "Consulta veterinaria", category: "Consulta", duration: "30 min" },
      { name: "Vacunación", category: "Vacunación", duration: "15 min" },
      { name: "Baño y peluquería", category: "Baño y peluquería", duration: "60 min" },
    ],
  }),
  profile("Gimnasio y deporte", {
    client: "Socio",
    clients: "Socios",
    newClient: "Nuevo socio",
    reservation: "Clase",
    reservations: "Clases",
    newReservation: "Nueva clase",
    worker: "Entrenador",
    workers: "Entrenadores",
    newWorker: "Nuevo entrenador",
    addWorker: "Agregar entrenador",
    skillsLabel: "Clases y planes que puede dictar",
    workerRoles: ["Entrenador", "Nutricionista", "Recepcionista", "Administrador"],
    serviceCategories: ["Clases grupales", "Entrenamiento personal", "Planes mensuales", "Nutrición"],
    suggestedServices: [
      { name: "Entrenamiento personal", category: "Entrenamiento personal", duration: "60 min" },
      { name: "Clase grupal", category: "Clases grupales", duration: "60 min" },
    ],
  }),
  profile("Construcción y obras", {
    reservation: "Proyecto",
    reservations: "Proyectos",
    newReservation: "Nuevo proyecto",
    worker: "Colaborador",
    workers: "Colaboradores",
    newWorker: "Nuevo colaborador",
    addWorker: "Agregar colaborador",
    skillsLabel: "Trabajos que puede realizar",
    workerRoles: ["Maestro de obra", "Ingeniero residente", "Arquitecto", "Oficial", "Ayudante", "Almacenista", "Administrador"],
    serviceCategories: ["Obra civil", "Acabados", "Diseño y planos", "Interventoría", "Remodelación"],
    suggestedServices: [
      { name: "Visita técnica y cotización", category: "Obra civil", duration: "60 min" },
      { name: "Diseño arquitectónico", category: "Diseño y planos", duration: "1 semana" },
      { name: "Remodelación", category: "Remodelación", duration: "1 semana" },
    ],
  }),
  profile("Transporte y logística", {
    reservation: "Despacho",
    reservations: "Despachos",
    newReservation: "Nuevo despacho",
    worker: "Conductor",
    workers: "Conductores",
    newWorker: "Nuevo conductor",
    addWorker: "Agregar conductor",
    skillsLabel: "Servicios que puede realizar",
    workerRoles: ["Conductor", "Despachador", "Auxiliar de carga", "Mensajero", "Administrador"],
    serviceCategories: ["Transporte de carga", "Mensajería", "Mudanzas", "Domicilios"],
    suggestedServices: [
      { name: "Mensajería urbana", category: "Mensajería", duration: "60 min" },
      { name: "Transporte de carga", category: "Transporte de carga", duration: "180 min" },
      { name: "Mudanza", category: "Mudanzas", duration: "240 min" },
    ],
  }),
  profile("Eventos y entretenimiento", {
    reservation: "Evento",
    reservations: "Eventos",
    newReservation: "Nuevo evento",
    worker: "Colaborador",
    workers: "Colaboradores",
    newWorker: "Nuevo colaborador",
    addWorker: "Agregar colaborador",
    skillsLabel: "Servicios que puede cubrir",
    workerRoles: ["Coordinador de eventos", "DJ", "Fotógrafo", "Técnico de sonido", "Staff", "Administrador"],
    serviceCategories: ["Bodas", "Eventos corporativos", "Fiestas infantiles", "Alquiler de equipos", "Ambientación"],
    suggestedServices: [
      { name: "Coordinación de evento", category: "Eventos corporativos", duration: "480 min" },
      { name: "Fiesta infantil", category: "Fiestas infantiles", duration: "180 min" },
      { name: "Alquiler de sonido", category: "Alquiler de equipos", duration: "480 min" },
    ],
  }),
  profile("Agropecuario", {
    reservation: "Pedido",
    reservations: "Pedidos",
    newReservation: "Nuevo pedido",
    worker: "Colaborador",
    workers: "Colaboradores",
    newWorker: "Nuevo colaborador",
    addWorker: "Agregar colaborador",
    skillsLabel: "Labores que puede realizar",
    workerRoles: ["Operario", "Mayordomo", "Agrónomo", "Veterinario", "Administrador"],
    serviceCategories: ["Cultivos", "Ganadería", "Insumos", "Asistencia técnica"],
    suggestedServices: [
      { name: "Asistencia técnica en finca", category: "Asistencia técnica", duration: "120 min" },
      { name: "Entrega de insumos", category: "Insumos", duration: "60 min" },
    ],
  }),
  profile("Fundaciones y organizaciones", {
    client: "Beneficiario",
    clients: "Beneficiarios",
    newClient: "Nuevo beneficiario",
    reservation: "Actividad",
    reservations: "Actividades",
    newReservation: "Nueva actividad",
    service: "Programa",
    services: "Programas",
    newService: "Nuevo programa",
    worker: "Voluntario",
    workers: "Voluntarios",
    newWorker: "Nuevo voluntario",
    addWorker: "Agregar voluntario",
    skillsLabel: "Programas en los que participa",
    workerRoles: ["Coordinador", "Voluntario", "Trabajador social", "Administrador"],
    serviceCategories: ["Educación", "Salud", "Alimentación", "Apoyo social"],
    suggestedServices: [
      { name: "Jornada de atención", category: "Apoyo social", duration: "180 min" },
    ],
  }),
  profile("Otro", {}),
];

type TypeOverrides = Partial<Omit<IndustryProfile, "type">>;

type TypeDef = { label: string; overrides?: TypeOverrides };

export type TypeGroup = { group: string; base: string; types: TypeDef[] };

const svc = (name: string, category: string, duration: string): SuggestedService => ({
  name,
  category,
  duration,
});

/** Sectores y tipos de negocio que se pueden elegir. */
export const TYPE_GROUPS: TypeGroup[] = [
  {
    group: "Belleza y bienestar",
    base: "Belleza y bienestar",
    types: [
      {
        label: "Barbería",
        overrides: {
          workerRoles: ["Barbero", "Estilista", "Recepcionista", "Administrador"],
          serviceCategories: ["Corte", "Barba", "Cejas", "Tratamientos", "Combos"],
          suggestedServices: [
            svc("Corte de cabello", "Corte", "30 min"),
            svc("Arreglo de barba", "Barba", "20 min"),
            svc("Corte + barba", "Combos", "45 min"),
            svc("Perfilado de cejas", "Cejas", "10 min"),
          ],
        },
      },
      {
        label: "Salón de belleza",
        overrides: {
          serviceCategories: ["Cabello", "Color", "Peinados", "Uñas", "Estética facial", "Maquillaje"],
          suggestedServices: [
            svc("Corte de dama", "Cabello", "45 min"),
            svc("Tinte completo", "Color", "120 min"),
            svc("Peinado", "Peinados", "45 min"),
            svc("Alisado con keratina", "Cabello", "150 min"),
            svc("Manicure", "Uñas", "45 min"),
          ],
        },
      },
      { label: "Peluquería" },
      {
        label: "Spa",
        overrides: {
          workerRoles: ["Terapeuta", "Esteticista", "Recepcionista", "Administrador"],
          serviceCategories: ["Masajes", "Faciales", "Corporales", "Hidroterapia", "Rituales"],
          suggestedServices: [
            svc("Masaje relajante", "Masajes", "60 min"),
            svc("Limpieza facial", "Faciales", "60 min"),
            svc("Exfoliación corporal", "Corporales", "45 min"),
            svc("Circuito de hidroterapia", "Hidroterapia", "90 min"),
          ],
        },
      },
      { label: "Centro de estética" },
      {
        label: "Uñas y manicure",
        overrides: {
          workerRoles: ["Manicurista", "Recepcionista", "Administrador"],
          serviceCategories: ["Manicure", "Pedicure", "Uñas acrílicas", "Semipermanente", "Diseño"],
          suggestedServices: [
            svc("Manicure tradicional", "Manicure", "40 min"),
            svc("Pedicure", "Pedicure", "50 min"),
            svc("Esmaltado semipermanente", "Semipermanente", "60 min"),
            svc("Uñas acrílicas", "Uñas acrílicas", "90 min"),
          ],
        },
      },
      {
        label: "Centro de masajes",
        overrides: {
          serviceCategories: ["Relajante", "Descontracturante", "Drenaje linfático", "Reflexología"],
          suggestedServices: [
            svc("Masaje relajante", "Relajante", "60 min"),
            svc("Masaje descontracturante", "Descontracturante", "60 min"),
            svc("Drenaje linfático", "Drenaje linfático", "60 min"),
          ],
        },
      },
      { label: "Maquillaje y asesoría de imagen" },
      { label: "Tatuajes y piercing" },
      { label: "Depilación láser" },
    ],
  },
  {
    group: "Salud",
    base: "Salud",
    types: [
      {
        label: "Clínica",
        overrides: {
          workerRoles: ["Médico general", "Especialista", "Enfermero/a", "Auxiliar", "Recepcionista", "Administrador"],
          serviceCategories: ["Consulta general", "Especialistas", "Urgencias", "Laboratorio", "Procedimientos", "Hospitalización"],
          suggestedServices: [
            svc("Consulta general", "Consulta general", "30 min"),
            svc("Consulta con especialista", "Especialistas", "30 min"),
            svc("Examen de laboratorio", "Laboratorio", "15 min"),
            svc("Procedimiento menor", "Procedimientos", "45 min"),
          ],
        },
      },
      { label: "Consultorio médico" },
      {
        label: "Odontología",
        overrides: {
          workerRoles: ["Odontólogo", "Higienista oral", "Auxiliar", "Recepcionista", "Administrador"],
          serviceCategories: ["Valoración", "Limpieza", "Ortodoncia", "Endodoncia", "Blanqueamiento", "Cirugía oral"],
          suggestedServices: [
            svc("Valoración odontológica", "Valoración", "30 min"),
            svc("Limpieza dental", "Limpieza", "45 min"),
            svc("Blanqueamiento", "Blanqueamiento", "60 min"),
            svc("Control de ortodoncia", "Ortodoncia", "30 min"),
          ],
        },
      },
      {
        label: "Psicología y terapia",
        overrides: {
          workerRoles: ["Psicólogo", "Terapeuta", "Psiquiatra", "Recepcionista", "Administrador"],
          serviceCategories: ["Terapia individual", "Terapia de pareja", "Terapia familiar", "Orientación", "Evaluación"],
          suggestedServices: [
            svc("Sesión individual", "Terapia individual", "50 min"),
            svc("Terapia de pareja", "Terapia de pareja", "60 min"),
            svc("Evaluación psicológica", "Evaluación", "90 min"),
          ],
        },
      },
      {
        label: "Fisioterapia y rehabilitación",
        overrides: {
          workerRoles: ["Fisioterapeuta", "Terapeuta ocupacional", "Auxiliar", "Recepcionista", "Administrador"],
          serviceCategories: ["Rehabilitación", "Terapia manual", "Ejercicio terapéutico", "Electroterapia"],
          suggestedServices: [
            svc("Valoración fisioterapéutica", "Rehabilitación", "45 min"),
            svc("Sesión de fisioterapia", "Rehabilitación", "45 min"),
            svc("Terapia manual", "Terapia manual", "30 min"),
          ],
        },
      },
      {
        label: "Optometría",
        overrides: {
          workerRoles: ["Optómetra", "Asesor óptico", "Recepcionista", "Administrador"],
          serviceCategories: ["Examen visual", "Lentes", "Lentes de contacto"],
          suggestedServices: [
            svc("Examen visual", "Examen visual", "30 min"),
            svc("Adaptación de lentes de contacto", "Lentes de contacto", "40 min"),
          ],
        },
      },
      { label: "Laboratorio clínico" },
      { label: "Nutrición y dietética" },
      { label: "Imágenes diagnósticas" },
      { label: "Medicina estética" },
      { label: "Terapias alternativas" },
    ],
  },
  {
    group: "Droguería y farmacia",
    base: "Droguería y farmacia",
    types: [{ label: "Droguería" }, { label: "Farmacia" }, { label: "Tienda naturista" }],
  },
  {
    group: "Comercio / tienda",
    base: "Comercio / tienda",
    types: [
      { label: "Tienda de barrio o minimercado" },
      { label: "Supermercado" },
      { label: "Ropa y accesorios" },
      { label: "Calzado" },
      { label: "Ferretería" },
      { label: "Papelería" },
      { label: "Tecnología y celulares" },
      { label: "Muebles y hogar" },
      { label: "Joyería" },
      { label: "Juguetería" },
      { label: "Licorera" },
      { label: "Floristería" },
      { label: "Librería" },
      { label: "Repuestos y autopartes" },
      { label: "Tienda de mascotas" },
    ],
  },
  {
    group: "Restaurantes y alimentos",
    base: "Restaurante o cafetería",
    types: [
      { label: "Restaurante" },
      { label: "Cafetería" },
      {
        label: "Panadería y pastelería",
        overrides: {
          serviceCategories: ["Pedidos especiales", "Tortas", "Catering", "Domicilios"],
          suggestedServices: [
            svc("Torta por encargo", "Tortas", "2 días"),
            svc("Pedido para evento", "Pedidos especiales", "2 días"),
            svc("Domicilio", "Domicilios", "45 min"),
          ],
          workerRoles: ["Panadero", "Pastelero", "Cajero", "Domiciliario", "Administrador"],
        },
      },
      { label: "Comidas rápidas" },
      { label: "Bar y discoteca" },
      { label: "Catering y banquetes" },
      { label: "Heladería" },
      { label: "Food truck" },
    ],
  },
  {
    group: "Servicios profesionales",
    base: "Servicios profesionales",
    types: [
      { label: "Abogados" },
      { label: "Contabilidad y finanzas" },
      { label: "Consultoría empresarial" },
      { label: "Arquitectura e ingeniería" },
      { label: "Agencia de marketing y publicidad" },
      { label: "Inmobiliaria" },
      { label: "Seguros" },
      { label: "Fotografía y video" },
      { label: "Diseño gráfico" },
    ],
  },
  {
    group: "Educación y formación",
    base: "Educación y formación",
    types: [
      { label: "Colegio" },
      { label: "Academia o instituto" },
      {
        label: "Academia de idiomas",
        overrides: {
          serviceCategories: ["Inglés", "Francés", "Alemán", "Preparación de exámenes"],
          suggestedServices: [
            svc("Clase de inglés", "Inglés", "60 min"),
            svc("Clase de conversación", "Inglés", "60 min"),
            svc("Preparación de examen internacional", "Preparación de exámenes", "90 min"),
          ],
        },
      },
      { label: "Clases particulares" },
      { label: "Jardín infantil" },
      { label: "Escuela de conducción" },
      { label: "Escuela de música o arte" },
    ],
  },
  {
    group: "Hotelería y turismo",
    base: "Hotelería y turismo",
    types: [
      {
        label: "Hotel",
        overrides: {
          serviceCategories: ["Alojamiento", "Alimentación", "Eventos", "Transporte"],
          suggestedServices: [
            svc("Habitación sencilla", "Alojamiento", "1 noche"),
            svc("Habitación doble", "Alojamiento", "1 noche"),
            svc("Suite", "Alojamiento", "1 noche"),
            svc("Desayuno", "Alimentación", "60 min"),
          ],
        },
      },
      { label: "Hostal" },
      {
        label: "Agencia de viajes",
        overrides: {
          serviceCategories: ["Paquetes turísticos", "Tiquetes", "Hoteles", "Seguros de viaje"],
          suggestedServices: [
            svc("Asesoría de viaje", "Paquetes turísticos", "45 min"),
            svc("Paquete turístico", "Paquetes turísticos", "1 día"),
          ],
        },
      },
      { label: "Alquiler vacacional" },
      { label: "Transporte turístico" },
    ],
  },
  {
    group: "Tecnología",
    base: "Tecnología",
    types: [
      { label: "Desarrollo de software" },
      { label: "Soporte técnico informático" },
      {
        label: "Reparación de computadores y celulares",
        overrides: {
          workerRoles: ["Técnico", "Recepcionista", "Administrador"],
          serviceCategories: ["Reparación de celulares", "Reparación de computadores", "Cambio de pantalla", "Software y formateo"],
          suggestedServices: [
            svc("Diagnóstico", "Reparación de computadores", "30 min"),
            svc("Cambio de pantalla", "Cambio de pantalla", "60 min"),
            svc("Formateo e instalación", "Software y formateo", "90 min"),
            svc("Limpieza y mantenimiento", "Reparación de computadores", "60 min"),
          ],
        },
      },
      { label: "Hosting y servicios web" },
    ],
  },
  {
    group: "Telecomunicaciones y técnicos",
    base: "Telecomunicaciones y técnicos",
    types: [
      { label: "Proveedor de internet" },
      { label: "Telecomunicaciones" },
      {
        label: "Cámaras y seguridad electrónica",
        overrides: {
          serviceCategories: ["Instalación de cámaras", "Alarmas", "Control de acceso", "Mantenimiento"],
          suggestedServices: [
            svc("Instalación de cámara", "Instalación de cámaras", "60 min"),
            svc("Visita de diagnóstico", "Mantenimiento", "45 min"),
            svc("Mantenimiento preventivo", "Mantenimiento", "60 min"),
          ],
        },
      },
      { label: "Redes y cableado" },
    ],
  },
  {
    group: "Automotriz",
    base: "Taller automotriz",
    types: [
      { label: "Taller mecánico" },
      {
        label: "Lavadero de autos",
        overrides: {
          worker: "Operario",
          workers: "Operarios",
          newWorker: "Nuevo operario",
          addWorker: "Agregar operario",
          workerRoles: ["Lavador", "Detallador", "Cajero", "Administrador"],
          serviceCategories: ["Lavado", "Brillado", "Aspirado", "Detallado"],
          suggestedServices: [
            svc("Lavado sencillo", "Lavado", "30 min"),
            svc("Lavado completo", "Lavado", "60 min"),
            svc("Polichado", "Brillado", "120 min"),
          ],
        },
      },
      { label: "Latonería y pintura" },
      { label: "Montallantas" },
      { label: "Concesionario de vehículos" },
      { label: "Parqueadero" },
    ],
  },
  {
    group: "Hogar y mantenimiento",
    base: "Mantenimiento y servicios del hogar",
    types: [
      { label: "Plomería y electricidad" },
      { label: "Aseo y limpieza" },
      { label: "Cerrajería" },
      { label: "Jardinería" },
      { label: "Pintura y remodelación" },
      { label: "Fumigación" },
      { label: "Mudanzas" },
      {
        label: "Lavandería",
        overrides: {
          worker: "Operario",
          workers: "Operarios",
          newWorker: "Nuevo operario",
          addWorker: "Agregar operario",
          workerRoles: ["Operario", "Cajero", "Domiciliario", "Administrador"],
          serviceCategories: ["Lavado por kilo", "Lavado en seco", "Planchado", "Domicilio"],
          suggestedServices: [
            svc("Lavado por kilo", "Lavado por kilo", "1 día"),
            svc("Lavado en seco", "Lavado en seco", "2 días"),
            svc("Planchado", "Planchado", "1 día"),
          ],
        },
      },
    ],
  },
  {
    group: "Veterinaria y mascotas",
    base: "Veterinaria y mascotas",
    types: [
      { label: "Clínica veterinaria" },
      {
        label: "Peluquería canina",
        overrides: {
          workerRoles: ["Peluquero canino", "Auxiliar", "Recepcionista", "Administrador"],
          serviceCategories: ["Baño", "Corte", "Spa canino"],
          suggestedServices: [
            svc("Baño y corte", "Corte", "60 min"),
            svc("Baño medicado", "Baño", "45 min"),
            svc("Corte de uñas", "Corte", "10 min"),
          ],
        },
      },
      { label: "Guardería de mascotas" },
    ],
  },
  {
    group: "Deporte y bienestar físico",
    base: "Gimnasio y deporte",
    types: [
      { label: "Gimnasio" },
      { label: "Entrenamiento funcional y crossfit" },
      {
        label: "Yoga y pilates",
        overrides: {
          serviceCategories: ["Yoga", "Pilates", "Meditación"],
          suggestedServices: [
            svc("Clase de yoga", "Yoga", "60 min"),
            svc("Clase de pilates", "Pilates", "55 min"),
          ],
          workerRoles: ["Instructor", "Recepcionista", "Administrador"],
        },
      },
      { label: "Academia deportiva" },
      { label: "Canchas deportivas" },
      { label: "Escuela de natación" },
    ],
  },
  {
    group: "Construcción y obras",
    base: "Construcción y obras",
    types: [{ label: "Constructora" }, { label: "Obra civil y acabados" }],
  },
  {
    group: "Transporte y logística",
    base: "Transporte y logística",
    types: [{ label: "Transporte de carga" }, { label: "Mensajería y domicilios" }],
  },
  {
    group: "Eventos y entretenimiento",
    base: "Eventos y entretenimiento",
    types: [{ label: "Organización de eventos" }, { label: "Sonido, DJ y alquiler de equipos" }],
  },
  {
    group: "Agropecuario",
    base: "Agropecuario",
    types: [{ label: "Finca o producción agrícola" }, { label: "Ganadería" }, { label: "Insumos agropecuarios" }],
  },
  {
    group: "Fundaciones y organizaciones",
    base: "Fundaciones y organizaciones",
    types: [{ label: "Fundación u ONG" }, { label: "Iglesia o comunidad" }],
  },
  {
    group: "Otro",
    base: "Otro",
    types: [{ label: "Otro" }],
  },
];

export const BUSINESS_TYPE_OPTIONS: string[] = TYPE_GROUPS.flatMap((group) =>
  group.types.map((item) => item.label),
);

const FALLBACK = PROFILES[PROFILES.length - 1];

function sameText(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Perfil para un tipo de negocio. Acepta un tipo específico (Barbería),
 * un sector (Salud) o un texto libre (que usa el perfil general).
 */
export function getIndustryProfile(type: string | null | undefined): IndustryProfile {
  if (!type) return FALLBACK;

  for (const group of TYPE_GROUPS) {
    const found = group.types.find((item) => sameText(item.label, type));

    if (found) {
      const base = PROFILES.find((item) => item.type === group.base) ?? FALLBACK;

      return { ...base, ...found.overrides, type: found.label };
    }
  }

  const sector = PROFILES.find((item) => sameText(item.type, type));

  return sector ?? { ...FALLBACK, type };
}

/** Perfil del negocio activo. */
export function useIndustry(): IndustryProfile {
  const { activeMembership } = useAuth();

  return getIndustryProfile(activeMembership?.business.business_type);
}

export function lower(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
