--
-- PostgreSQL database dump
--

\restrict yIvhWaKDR5g96F4MZu7bqIWxvCHwXKOOuOEGj0JZ1WUmz0Da2DqNFfJgnJkStXj

-- Dumped from database version 17.7
-- Dumped by pg_dump version 18.0

-- Started on 2026-02-02 15:55:33

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16469)
-- Name: clientes; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    direccion text,
    telefono character varying(20),
    ruta_id integer NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.clientes OWNER TO dbmasteruser;

--
-- TOC entry 221 (class 1259 OID 16468)
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4465 (class 0 OID 0)
-- Dependencies: 221
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- TOC entry 238 (class 1259 OID 16625)
-- Name: discount_rules; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.discount_rules (
    id integer NOT NULL,
    cliente_id integer,
    producto_id integer NOT NULL,
    tipo_descuento character varying(20) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.discount_rules OWNER TO dbmasteruser;

--
-- TOC entry 237 (class 1259 OID 16624)
-- Name: discount_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.discount_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discount_rules_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4466 (class 0 OID 0)
-- Dependencies: 237
-- Name: discount_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.discount_rules_id_seq OWNED BY public.discount_rules.id;


--
-- TOC entry 240 (class 1259 OID 16645)
-- Name: discount_tiers; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.discount_tiers (
    id integer NOT NULL,
    rule_id integer NOT NULL,
    volumen_desde numeric(10,3) NOT NULL,
    descuento_monto numeric(10,2) NOT NULL
);


ALTER TABLE public.discount_tiers OWNER TO dbmasteruser;

--
-- TOC entry 239 (class 1259 OID 16644)
-- Name: discount_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.discount_tiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discount_tiers_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4467 (class 0 OID 0)
-- Dependencies: 239
-- Name: discount_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.discount_tiers_id_seq OWNED BY public.discount_tiers.id;


--
-- TOC entry 228 (class 1259 OID 16511)
-- Name: inventario_bodega; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.inventario_bodega (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad numeric(10,3) NOT NULL,
    ultima_actualizacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inventario_bodega OWNER TO dbmasteruser;

--
-- TOC entry 227 (class 1259 OID 16510)
-- Name: inventario_bodega_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.inventario_bodega_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventario_bodega_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4468 (class 0 OID 0)
-- Dependencies: 227
-- Name: inventario_bodega_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.inventario_bodega_id_seq OWNED BY public.inventario_bodega.id;


--
-- TOC entry 226 (class 1259 OID 16492)
-- Name: inventario_ruta; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.inventario_ruta (
    id integer NOT NULL,
    ruta_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad numeric(10,3) NOT NULL,
    ultima_actualizacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inventario_ruta OWNER TO dbmasteruser;

--
-- TOC entry 225 (class 1259 OID 16491)
-- Name: inventario_ruta_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.inventario_ruta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventario_ruta_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4469 (class 0 OID 0)
-- Dependencies: 225
-- Name: inventario_ruta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.inventario_ruta_id_seq OWNED BY public.inventario_ruta.id;


--
-- TOC entry 230 (class 1259 OID 16527)
-- Name: movimientos_stock; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.movimientos_stock (
    id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    producto_id integer NOT NULL,
    cantidad numeric(10,3) NOT NULL,
    ruta_id integer,
    usuario_id integer NOT NULL,
    notas text,
    fecha timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.movimientos_stock OWNER TO dbmasteruser;

--
-- TOC entry 229 (class 1259 OID 16526)
-- Name: movimientos_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.movimientos_stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movimientos_stock_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4470 (class 0 OID 0)
-- Dependencies: 229
-- Name: movimientos_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.movimientos_stock_id_seq OWNED BY public.movimientos_stock.id;


--
-- TOC entry 224 (class 1259 OID 16484)
-- Name: productos; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    precio numeric(10,2) NOT NULL,
    unidad character varying(20) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.productos OWNER TO dbmasteruser;

--
-- TOC entry 223 (class 1259 OID 16483)
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4471 (class 0 OID 0)
-- Dependencies: 223
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- TOC entry 218 (class 1259 OID 16440)
-- Name: rutas; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.rutas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activa boolean DEFAULT true NOT NULL
);


ALTER TABLE public.rutas OWNER TO dbmasteruser;

--
-- TOC entry 217 (class 1259 OID 16439)
-- Name: rutas_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.rutas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rutas_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4472 (class 0 OID 0)
-- Dependencies: 217
-- Name: rutas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.rutas_id_seq OWNED BY public.rutas.id;


--
-- TOC entry 236 (class 1259 OID 16605)
-- Name: sync_events; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.sync_events (
    id integer NOT NULL,
    event_id character varying(100) NOT NULL,
    usuario_id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    payload text NOT NULL,
    procesado boolean DEFAULT false NOT NULL,
    fecha_recepcion timestamp without time zone DEFAULT now() NOT NULL,
    fecha_procesamiento timestamp without time zone,
    error text
);


ALTER TABLE public.sync_events OWNER TO dbmasteruser;

--
-- TOC entry 235 (class 1259 OID 16604)
-- Name: sync_events_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.sync_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_events_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4473 (class 0 OID 0)
-- Dependencies: 235
-- Name: sync_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.sync_events_id_seq OWNED BY public.sync_events.id;


--
-- TOC entry 220 (class 1259 OID 16450)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password text NOT NULL,
    nombre character varying(100) NOT NULL,
    rol character varying(20) NOT NULL,
    ruta_id integer,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.usuarios OWNER TO dbmasteruser;

--
-- TOC entry 219 (class 1259 OID 16449)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4474 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 234 (class 1259 OID 16587)
-- Name: venta_items; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.venta_items (
    id integer NOT NULL,
    venta_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad numeric(10,3) NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL
);


ALTER TABLE public.venta_items OWNER TO dbmasteruser;

--
-- TOC entry 233 (class 1259 OID 16586)
-- Name: venta_items_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.venta_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.venta_items_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4475 (class 0 OID 0)
-- Dependencies: 233
-- Name: venta_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.venta_items_id_seq OWNED BY public.venta_items.id;


--
-- TOC entry 232 (class 1259 OID 16555)
-- Name: ventas; Type: TABLE; Schema: public; Owner: dbmasteruser
--

CREATE TABLE public.ventas (
    id integer NOT NULL,
    cliente_tx_id character varying(100) NOT NULL,
    usuario_id integer NOT NULL,
    cliente_id integer NOT NULL,
    ruta_id integer NOT NULL,
    fecha_venta timestamp without time zone NOT NULL,
    fecha_sync timestamp without time zone DEFAULT now() NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    descuento numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    descuento_aplicado text
);


ALTER TABLE public.ventas OWNER TO dbmasteruser;

--
-- TOC entry 231 (class 1259 OID 16554)
-- Name: ventas_id_seq; Type: SEQUENCE; Schema: public; Owner: dbmasteruser
--

CREATE SEQUENCE public.ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ventas_id_seq OWNER TO dbmasteruser;

--
-- TOC entry 4476 (class 0 OID 0)
-- Dependencies: 231
-- Name: ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbmasteruser
--

ALTER SEQUENCE public.ventas_id_seq OWNED BY public.ventas.id;


--
-- TOC entry 4206 (class 2604 OID 16472)
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- TOC entry 4223 (class 2604 OID 16628)
-- Name: discount_rules id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.discount_rules ALTER COLUMN id SET DEFAULT nextval('public.discount_rules_id_seq'::regclass);


--
-- TOC entry 4226 (class 2604 OID 16648)
-- Name: discount_tiers id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.discount_tiers ALTER COLUMN id SET DEFAULT nextval('public.discount_tiers_id_seq'::regclass);


--
-- TOC entry 4212 (class 2604 OID 16514)
-- Name: inventario_bodega id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.inventario_bodega ALTER COLUMN id SET DEFAULT nextval('public.inventario_bodega_id_seq'::regclass);


--
-- TOC entry 4210 (class 2604 OID 16495)
-- Name: inventario_ruta id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.inventario_ruta ALTER COLUMN id SET DEFAULT nextval('public.inventario_ruta_id_seq'::regclass);


--
-- TOC entry 4214 (class 2604 OID 16530)
-- Name: movimientos_stock id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.movimientos_stock ALTER COLUMN id SET DEFAULT nextval('public.movimientos_stock_id_seq'::regclass);


--
-- TOC entry 4208 (class 2604 OID 16487)
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- TOC entry 4202 (class 2604 OID 16443)
-- Name: rutas id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.rutas ALTER COLUMN id SET DEFAULT nextval('public.rutas_id_seq'::regclass);


--
-- TOC entry 4220 (class 2604 OID 16608)
-- Name: sync_events id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.sync_events ALTER COLUMN id SET DEFAULT nextval('public.sync_events_id_seq'::regclass);


--
-- TOC entry 4204 (class 2604 OID 16453)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4219 (class 2604 OID 16590)
-- Name: venta_items id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.venta_items ALTER COLUMN id SET DEFAULT nextval('public.venta_items_id_seq'::regclass);


--
-- TOC entry 4216 (class 2604 OID 16558)
-- Name: ventas id; Type: DEFAULT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.ventas ALTER COLUMN id SET DEFAULT nextval('public.ventas_id_seq'::regclass);


--
-- TOC entry 4441 (class 0 OID 16469)
-- Dependencies: 222
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.clientes (id, nombre, direccion, telefono, ruta_id, activo) FROM stdin;
1	Misc Danny	\N	\N	1	t
2	Misc. Flower	\N	\N	1	t
3	Miscelanea La Pasadita	\N	\N	1	t
4	Misc La Manzanita	\N	\N	1	t
5	Misc Cardenas	\N	\N	1	t
6	Miscelanea Aurora	\N	\N	1	t
7	Candy shop	\N	\N	1	t
8	Misc El Mexicano	\N	\N	1	t
9	Carniceria Los Laureles	\N	\N	1	t
10	Miscelanea Castañeda	\N	\N	1	t
11	Los Alejandros	\N	\N	1	t
12	Miscelanea Don Jose	\N	\N	1	t
13	Antojitos Chepitas	\N	\N	1	t
14	Super Greñas	\N	\N	1	t
15	Misc. La Pasadita	\N	\N	1	t
16	Tortilleria Jaramillo	\N	\N	1	t
17	Hamburguesas El Parrillero	\N	\N	1	t
18	Don Carnes	\N	\N	1	t
19	Fruteria y Abarrotes La Loma	\N	\N	1	t
20	Misc La Luz	\N	\N	1	t
21	ANTONIO GERARDO MERAZ HURTADO	\N	\N	1	t
22	Misc El Meño	\N	\N	1	t
23	Mini Super Ale	\N	\N	1	t
24	Misc Los 2 Pepes	\N	\N	1	t
25	Misc. Yelli	\N	\N	1	t
26	Misc Lupita	\N	\N	1	t
27	Carniceria El Torete	\N	\N	1	t
28	Mini Super Mary	\N	\N	1	t
29	Mini Super Sergio	\N	\N	1	t
30	Mini super Zaragoza	\N	\N	1	t
31	Miscelanea Lucero	\N	\N	1	t
32	MARIA IGNACIA REYES MELERO	\N	\N	1	t
33	Miscelanea Dany	\N	\N	1	t
34	Miscelanea El Durazno	\N	\N	1	t
35	Misc Las Flores	\N	\N	1	t
36	Miscelanea Las Flores	\N	\N	1	t
37	Miscelanea Mary	\N	\N	1	t
38	SAMANTHA ORTIZ ANDRADE	\N	\N	1	t
39	Miscelanea El Sueño	\N	\N	1	t
40	Tortilleria Nuevo Amanecer	\N	\N	1	t
41	Miscelanea Iglecias	\N	\N	1	t
42	Mini Super Colibri	\N	\N	1	t
43	Miscelanea Oscar	\N	\N	1	t
44	Ivonne	\N	\N	1	t
45	Misc  Sofi	\N	\N	1	t
46	Misc Dany	\N	\N	1	t
47	Miscelane La Ventanita	\N	\N	1	t
48	Misc Aries	\N	\N	1	t
49	Miscelanea Los Rosalitos	\N	\N	1	t
50	Miscelanea Lupita	\N	\N	1	t
51	Misc Andy	\N	\N	1	t
52	Miscelanea Don Nacho	\N	\N	1	t
53	Misc Socorro	\N	\N	1	t
54	Misc Mayela	\N	\N	1	t
55	Misc El Girasol	\N	\N	1	t
56	Misc La Fe	\N	\N	1	t
57	Miscelanea Dianita	\N	\N	1	t
58	Misc Gina	\N	\N	1	t
59	Mini Super Mas	\N	\N	1	t
60	Miscelanea Norma	\N	\N	1	t
61	Miscelanea Imelda	\N	\N	1	t
62	Miscelanea El Angel	\N	\N	1	t
63	Antojitos Silvia	\N	\N	1	t
64	Miscelanea Gabino	\N	\N	1	t
65	Misc Cardenas	\N	\N	1	t
66	Misc El Oxxito	\N	\N	1	t
67	Miscelanea La Pasadita	\N	\N	1	t
68	Misc El Meño	\N	\N	1	t
69	Mini Super Ale	\N	\N	1	t
70	Misc Mi Dulce Antojo	\N	\N	1	t
71	Papelería y abarrotes "El Girasolito"	\N	\N	1	t
72	Los 3 Reyes	\N	\N	1	t
73	Miscelanea Katty	\N	\N	1	t
74	Misc  Mr chencholain	\N	\N	1	t
75	Ab y Dulceria BonBons	\N	\N	1	t
76	Miscelanea San Jose	\N	\N	1	t
77	Misc. Paty	\N	\N	1	t
78	Ab y Dulceria BonBons	\N	\N	1	t
79	Casi Todo	\N	\N	1	t
80	Misc Los Pinos	\N	\N	1	t
81	MARIA IGNACIA REYES MELERO	\N	\N	1	t
82	Miscelanea Silvia	\N	\N	1	t
83	Misc Los Pinos	\N	\N	1	t
84	La Tiendita de Juanita	\N	\N	2	t
85	Panaderia Palma	\N	\N	2	t
86	Tortilleria Santa Fe	\N	\N	2	t
87	Misc Romina	\N	\N	2	t
88	Mini Super Mary	\N	\N	2	t
89	Misc Alvarado	\N	\N	2	t
90	Fruteria Victoria 2	\N	\N	2	t
91	Miscelanea y Fruteria Jessi	\N	\N	2	t
92	Miscelanea Rubi	\N	\N	2	t
93	Alicia Gonzalez Moreno	\N	\N	2	t
94	Rosa de la Cruz Ortega	\N	\N	2	t
95	Miscelanea Gaby	\N	\N	2	t
96	Misc La Ventanita	\N	\N	2	t
97	Angelica Alcala Hernandez	\N	\N	2	t
98	Miscelanea Canelas	\N	\N	2	t
99	La Costilla Carne Asada	\N	\N	2	t
100	MARIA DE JESUS NEVAREZ RODRIGUEZ	\N	\N	2	t
101	Fruteria y Cremeria Victoria	\N	\N	2	t
102	Miscelanea Lolo	\N	\N	2	t
103	Misc Las Cuatas	\N	\N	2	t
104	Carniceria Briseño	\N	\N	2	t
105	Multiabastos	\N	\N	2	t
106	Gorditas y Abarrotes Chapoy	\N	\N	2	t
107	Mini Super Alex 2	\N	\N	2	t
108	Matilde Yocupicio Valencia	\N	\N	2	t
109	Miscelanea Arcoiris	\N	\N	2	t
110	Miscelanea Los Primos	\N	\N	2	t
111	Abarrotes Reforma	\N	\N	2	t
112	Misc Dany	\N	\N	2	t
113	Misc Ancar	\N	\N	2	t
114	Ab Monju	\N	\N	2	t
115	Misc Segovia	\N	\N	2	t
116	Six 8 Cavazos	\N	\N	2	t
117	Miscelanea Alex	\N	\N	2	t
118	Los Primos 4	\N	\N	2	t
119	Misc Carolina	\N	\N	2	t
120	Miscelanea Janeth	\N	\N	2	t
121	Miscelanea Vale	\N	\N	2	t
122	Miscelanea Mary	\N	\N	2	t
123	Miscelanea La Marina	\N	\N	2	t
124	Miscelanea Saucedo	\N	\N	2	t
125	Miscelanea Paty	\N	\N	2	t
126	HECTOR SAUL HERNANDEZ SANCHEZ	\N	\N	2	t
127	Miscelanea Chuyito	\N	\N	2	t
128	Ismael Aleman Alanis	\N	\N	2	t
129	MANUEL DE JESUS HERNANDEZ MARTINEZ	\N	\N	2	t
130	Misc Los 7	\N	\N	2	t
131	Miscelanea Lucy	\N	\N	2	t
132	Misc La Fe	\N	\N	2	t
133	Misc Lupita	\N	\N	2	t
134	Miscelsnea Galvan	\N	\N	2	t
135	MARIA DORELIA HERRERA GIL	\N	\N	2	t
136	Super Fast	\N	\N	2	t
137	SERGIO DAVID ALVAREZ SERRANO	\N	\N	2	t
138	MANUEL DE JESUS HERNANDEZ MARTINEZ	\N	\N	2	t
139	Miscelanea Selene	\N	\N	2	t
140	Miscelanea Melany	\N	\N	2	t
141	Elizabeth Herrera Corral	\N	\N	2	t
142	JOSE ALBERTO ROBLES CISNEROS	\N	\N	2	t
143	Mini Super Gerardo	\N	\N	2	t
144	Miscelanea El Tio	\N	\N	2	t
145	Misc. Velazquez	\N	\N	2	t
146	Autoservicio Claudia	\N	\N	2	t
147	Super El Angel	\N	\N	2	t
148	Super Pablo	\N	\N	2	t
149	MIsc Kitys II	\N	\N	2	t
150	Miscelanea La Chacala	\N	\N	2	t
151	Miscelanea El Baro	\N	\N	2	t
152	Mini Super Tex-Mex	\N	\N	2	t
153	Mini Super Parquesito	\N	\N	2	t
154	La Tiendita	\N	\N	2	t
155	Gorditas Chela	\N	\N	2	t
156	Misc Angel	\N	\N	2	t
157	Misc Charlys	\N	\N	2	t
158	Miscelanea Rio Rosy	\N	\N	2	t
159	Super 8	\N	\N	2	t
160	JUAN GARCIA GARCIA	\N	\N	2	t
161	MA. DE JESUS TAMAYO ORDOÑEZ	\N	\N	2	t
162	Miscelanea Martinns	\N	\N	2	t
163	MARTIN MARTINEZ GANDARA	\N	\N	2	t
164	Miscelanea Doña Julia	\N	\N	2	t
165	Fruteria Patricio	\N	\N	2	t
166	Miscelánea Laurita	\N	\N	2	t
167	Tortillería Las Carolinas	\N	\N	2	t
168	Jovanna Simental Holguin	\N	\N	2	t
169	Gorditas Pupis	\N	\N	2	t
170	Gorditas El Guero	\N	\N	2	t
171	Gorditas Mercedes	\N	\N	2	t
172	BERNARDO HERRERA RAMOS	\N	\N	2	t
173	El sazón de mamá	\N	\N	2	t
174	Tacos Soto	\N	\N	2	t
175	Mini Super Nombre de Dios	\N	\N	2	t
176	Miscelanea JLB	\N	\N	2	t
177	Tortilleria Durangueña	\N	\N	2	t
178	Carniceria La Picota	\N	\N	2	t
179	Antojitos Brisa	\N	\N	2	t
180	Fruteria Real	\N	\N	2	t
181	Miscelanea de Piedra	\N	\N	2	t
182	Miscelanea El paso	\N	\N	2	t
183	La pequeña Isla	\N	\N	2	t
184	Miscelánea Diaz	\N	\N	2	t
185	Frutería Coco Mango	\N	\N	2	t
186	Miscelánea La Palma	\N	\N	2	t
187	MARICELA BENITEZ MENDOZA	\N	\N	2	t
188	Miscelanea Sofy	\N	\N	2	t
189	Misc. Don Bucho	\N	\N	2	t
190	Mini Super Parquesito	\N	\N	2	t
191	La Tiendita	\N	\N	2	t
192	Misc Charlys	\N	\N	2	t
193	Miscelanea JLB	\N	\N	2	t
194	Miscelanea y Fruteria Jessi	\N	\N	2	t
195	Miscelanea Rubi	\N	\N	2	t
196	GRUPO VENVIS	\N	\N	2	t
197	Misc del Sabor	\N	\N	2	t
198	Angelica Alcala Hernandez	\N	\N	2	t
199	Miscelanea Canelas	\N	\N	2	t
200	Misc Las Cuatas	\N	\N	2	t
201	Gorditas Emmanuel	\N	\N	2	t
202	Abarrotes Reforma	\N	\N	2	t
203	Misc Ancar	\N	\N	2	t
204	Misc Segovia	\N	\N	2	t
205	miscelanea Doña Tere	\N	\N	2	t
206	Misc La Minita	\N	\N	2	t
207	Misc Gil´s	\N	\N	2	t
208	Misc Los 7	\N	\N	2	t
209	Misc Maci	\N	\N	2	t
210	Super Chinos	\N	\N	2	t
211	Mini Super 3 R	\N	\N	3	t
212	Misc Romina	\N	\N	3	t
213	Misc Uriel	\N	\N	3	t
214	Los Primos 4	\N	\N	3	t
215	Ismael Aleman Alanis	\N	\N	3	t
216	JOSE ALBERTO ROBLES CISNEROS	\N	\N	3	t
217	Super El Angel	\N	\N	3	t
218	Mini Super El Limoncito	\N	\N	3	t
219	Panaderia La Estrella	\N	\N	3	t
220	Super Pablo	\N	\N	3	t
221	MIsc Kitys II	\N	\N	3	t
222	La Pasadita	\N	\N	3	t
223	Misc Santuario	\N	\N	3	t
224	Misc Alexia	\N	\N	3	t
225	Tortilleria Campos	\N	\N	3	t
226	Miscelanea La Chacala	\N	\N	3	t
227	Miscelanea El Baro	\N	\N	3	t
228	Fruteria Silvia	\N	\N	3	t
229	Tortas BJ	\N	\N	3	t
230	Miscelanea Paty	\N	\N	3	t
231	Miscelanea Los Angeles	\N	\N	3	t
232	Miscelanea Las Encinas	\N	\N	3	t
233	Miscelanea Norma	\N	\N	3	t
234	Miscelanea Dante	\N	\N	3	t
235	Mini Super cerro del Mercado	\N	\N	3	t
236	Miscelanea Rubens	\N	\N	3	t
237	Miscelanea La Chiquita	\N	\N	3	t
238	Miscelanea Galvan	\N	\N	3	t
239	Guillermo	\N	\N	3	t
240	Miscelanea Los Nietos	\N	\N	3	t
241	Miscelanea Mayra	\N	\N	3	t
242	Cremeria y Fruteria San Francisco	\N	\N	3	t
243	Misc Cecy	\N	\N	3	t
244	El Trebol	\N	\N	3	t
245	Misc Victoria	\N	\N	3	t
246	Misc La Escondida	\N	\N	3	t
247	Misc Meche	\N	\N	3	t
248	Six Regato	\N	\N	3	t
249	Misc Morita	\N	\N	3	t
250	Miscelanea Don Toño	\N	\N	3	t
251	Regalet Santuario	\N	\N	3	t
252	Miscelanea Tiffany	\N	\N	3	t
253	Miscelanea El Tiendon	\N	\N	3	t
254	El Mexicano	\N	\N	3	t
255	Fruty Ocampo	\N	\N	3	t
256	Super Renacimiento	\N	\N	3	t
257	Misc Jr	\N	\N	3	t
258	Cremeria Romers	\N	\N	3	t
259	MARTIN MARTINEZ GANDARA	\N	\N	3	t
260	Miscelanea Doña Julia	\N	\N	3	t
261	Fruteria Patricio	\N	\N	3	t
262	Centenario	\N	\N	3	t
263	Itzel	\N	\N	3	t
264	Tortilleria Yosi	\N	\N	3	t
265	Michelle	\N	\N	3	t
266	OSCAR ENRIQUE TOPETE NEVAREZ	\N	\N	3	t
267	VICTOR RODRIGUEZ ALDACO	\N	\N	3	t
268	Mini Super El Chino I	\N	\N	3	t
269	Miscelanea La Burbuja	\N	\N	3	t
270	Super King	\N	\N	3	t
271	Chino´s	\N	\N	3	t
272	Don Juanito	\N	\N	3	t
273	Fruteria y Cremeria Nataly	\N	\N	3	t
274	Fruteria Divina Providencia	\N	\N	3	t
275	El Supercito	\N	\N	3	t
276	Miscelanea Gera	\N	\N	3	t
277	Misc Carlitos	\N	\N	3	t
278	Miscelanea Ampliacion Pri	\N	\N	3	t
279	Misc Juli	\N	\N	3	t
280	Miscelanea Rayo	\N	\N	3	t
281	MARIA DEL REFUGIO MEDRANO MARTINEZ	\N	\N	3	t
282	Miscelanea Ferrarin	\N	\N	3	t
283	Miscelanea La Negrita	\N	\N	3	t
284	Miscelanea Los Primos I	\N	\N	3	t
285	Miscelanea Eunice	\N	\N	3	t
286	Las Bendiciones	\N	\N	3	t
287	Abarrotes Irene	\N	\N	3	t
288	Hamburguesas Juanito	\N	\N	3	t
289	Carniceria Deraz	\N	\N	3	t
290	Miscelanea El Sube y Baja	\N	\N	3	t
291	Super Angeles	\N	\N	3	t
292	Misc El Profe	\N	\N	3	t
293	Fruteria Nuevo Orizonte	\N	\N	3	t
294	Misc Rodel	\N	\N	3	t
295	Miscelanea La Esquinita	\N	\N	3	t
296	MIGUEL ANTONIO SOTO MERCADO	\N	\N	3	t
297	Misc 3 Marias	\N	\N	3	t
298	Super La Consentida	\N	\N	3	t
299	Fruteria y Cremeria Carrillo	\N	\N	3	t
300	Super Fruteria La Yuca	\N	\N	3	t
301	Misc. Sn. Javier	\N	\N	3	t
302	Misc. Don Bucho	\N	\N	3	t
303	Minisuper Marquez	\N	\N	3	t
304	Misc Andys	\N	\N	3	t
305	El Jardin	\N	\N	3	t
306	Charito	\N	\N	3	t
307	El Milagro	\N	\N	3	t
308	Fruteria Don Jose	\N	\N	3	t
309	Misc. Pablo	\N	\N	3	t
310	Mi Cachito	\N	\N	3	t
311	Claudia	\N	\N	3	t
312	Misc. Los Arbolitos	\N	\N	3	t
313	Misc. La Villita	\N	\N	3	t
314	La Jerezana	\N	\N	3	t
315	Misc Gurrusel	\N	\N	3	t
316	Gorditas Silvia Ex Cuartel Juárez	\N	\N	3	t
317	Cremería La Carnala	\N	\N	3	t
318	GABRIELA ELIZABETH GUTIERREZ SIFUENTES	\N	\N	3	t
319	Antojitos El Sabor Ranchero	\N	\N	3	t
320	Miscelanea Merry	\N	\N	3	t
321	Miscelánea Las Palmeras	\N	\N	3	t
322	Carniceria y Cremeria Los Alfonsos	\N	\N	3	t
323	Tortilleria la Favorita	\N	\N	3	t
324	Mini súper los tocayos	\N	\N	3	t
325	Miscelánea Téllez	\N	\N	3	t
326	Mini super Fredy Fruit	\N	\N	3	t
327	Mini Super El Chino	\N	\N	3	t
328	Miscelánea Norma	\N	\N	3	t
329	Miscelánea Marlén	\N	\N	3	t
330	miscelanea Doña Tere	\N	\N	3	t
331	Misc La Minita	\N	\N	3	t
332	Carniceria El Cochito	\N	\N	3	t
333	Misc 3 Gueritos	\N	\N	3	t
334	Antojitos Mely	\N	\N	3	t
335	Misc Zaragoza	\N	\N	3	t
336	Fruteria Belisario	\N	\N	3	t
337	Misc Maci	\N	\N	3	t
338	Super Chinos	\N	\N	3	t
339	Tienda Urrea	\N	\N	3	t
340	Don Chuy	\N	\N	3	t
341	Calandrias	\N	\N	3	t
342	Comida Cacera	\N	\N	3	t
343	Antojitos Chepitas	\N	\N	4	t
344	Carniceria Hernandez	\N	\N	4	t
345	Carniceria Los Laureles	\N	\N	4	t
346	Super Greñas	\N	\N	4	t
347	Panaderia Tano S	\N	\N	4	t
348	Fruteria y Abarrotes La Loma	\N	\N	4	t
349	Misc Los 2 Pepes	\N	\N	4	t
350	Miscelanea Silvia	\N	\N	4	t
351	Mini Super Sergio	\N	\N	4	t
352	Mini super Zaragoza	\N	\N	4	t
353	Miscelanea Lucero	\N	\N	4	t
354	Miscelanea Amanecer	\N	\N	4	t
355	Miscelanea El Durazno	\N	\N	4	t
356	Miscelanea Castor	\N	\N	4	t
357	Tortilleria Nuevo Amanecer	\N	\N	4	t
358	Miscelanea Selene	\N	\N	4	t
359	Mini Super Colibri	\N	\N	4	t
360	Super Mas 2	\N	\N	4	t
361	Miscelanea Lupita	\N	\N	4	t
362	La Estrellita	\N	\N	4	t
363	Valentinos	\N	\N	4	t
364	Misc Kai-Zen	\N	\N	4	t
365	Miscelanea Las Palmas	\N	\N	4	t
366	Miscelanea Dianita	\N	\N	4	t
367	Miscelanea Yolis	\N	\N	4	t
368	Miscelanea VDG	\N	\N	4	t
369	Gorditas Kathis	\N	\N	4	t
370	Abarrotes La Ponderosa	\N	\N	4	t
371	Miscelanea La Esperanza	\N	\N	4	t
372	Desayunos Eva	\N	\N	4	t
373	Miscelanea Vicky	\N	\N	4	t
374	Miscelanea Lupita	\N	\N	4	t
375	Miscelanea Tercia de Reyes	\N	\N	4	t
376	Miscelanea La Casita de Chocolate	\N	\N	4	t
377	Carniceria Universal	\N	\N	4	t
378	Fruteria Lucero	\N	\N	4	t
379	Ma Lourdes	\N	\N	4	t
380	Tayoltita II	\N	\N	4	t
381	Misc Mayre	\N	\N	4	t
382	Misc Tadeo	\N	\N	4	t
383	Mini Super Mas	\N	\N	4	t
384	Misc Angel	\N	\N	4	t
385	Super Chemal	\N	\N	4	t
386	Carniceria Rio Florido	\N	\N	4	t
387	Miscelanea Angelito	\N	\N	4	t
388	Fruteria y Abarrotes Valtor	\N	\N	4	t
389	Mi Cabaña	\N	\N	4	t
390	Misc Dayana	\N	\N	4	t
391	La Tiendita de Xo	\N	\N	4	t
392	Super Tienda Abba	\N	\N	4	t
393	Mariscos Don Chava	\N	\N	4	t
394	Fruteria Real	\N	\N	4	t
395	La pequeña Isla	\N	\N	4	t
396	Miscelánea La Fe	\N	\N	4	t
397	Gorditas Lety	\N	\N	4	t
398	Miscelánea Gaby	\N	\N	4	t
399	Gorditas Coronado	\N	\N	4	t
400	Mi Tiendita	\N	\N	4	t
401	Miscelánea La Palma	\N	\N	4	t
402	Miscelanea Karla	\N	\N	4	t
403	Miscelánea Ortega	\N	\N	4	t
404	Mega Gorda Lety	\N	\N	4	t
405	Gorditas Martitha	\N	\N	4	t
406	Miscelanea Sofy	\N	\N	4	t
407	Miscelánea Angeles	\N	\N	4	t
408	Misc Morales	\N	\N	4	t
409	Jose Rodriguez Quezada	\N	\N	4	t
410	Misc Santy	\N	\N	4	t
411	Mini Super Tayoltita	\N	\N	4	t
412	Miscelanea El Angel	\N	\N	4	t
413	Miscelanea Gabino	\N	\N	4	t
414	Fruteria Victoria 2	\N	\N	4	t
415	Miscelanea Roye	\N	\N	4	t
416	Codigo Disponible	\N	\N	4	t
417	Fruteria y Cremeria Victoria	\N	\N	4	t
418	Veronica Esparza Lopez	\N	\N	4	t
419	Miscelanea Lolo	\N	\N	4	t
420	Antojitos Doña Julia	\N	\N	4	t
421	Misc Karla	\N	\N	4	t
422	Abarrotes Salazar	\N	\N	4	t
423	Musc. Jazmin	\N	\N	4	t
424	Los Compadres	\N	\N	4	t
425	Misc. Vecky	\N	\N	4	t
426	Super Carniceria Los Sauces	\N	\N	4	t
427	Carniceria Angel	\N	\N	4	t
428	Carniceria Briseño	\N	\N	4	t
429	Miscelanea Angelita	\N	\N	4	t
430	Multiabastos	\N	\N	4	t
431	Matilde Yocupicio Valencia	\N	\N	4	t
432	Miscelanea Los Primos	\N	\N	4	t
433	Abarrotes Miranda	\N	\N	4	t
434	Diconsa	\N	\N	4	t
435	Misceanea Aranza	\N	\N	4	t
436	Codigo Disponible	\N	\N	4	t
437	Super Los Arbolitos	\N	\N	4	t
438	Miscelanea La Marina	\N	\N	4	t
439	Codigo Disponible	\N	\N	4	t
440	Miscelanea Chuyito	\N	\N	4	t
441	Codigo Disponible	\N	\N	4	t
442	La Deportiva	\N	\N	4	t
443	Misc Angeles	\N	\N	4	t
444	Verde	\N	\N	4	t
445	Misc Mas que Barato	\N	\N	4	t
446	Abarrotes Galvan	\N	\N	4	t
447	Fruteria Los Maxis	\N	\N	4	t
448	Los Changos	\N	\N	4	t
449	Misc Chibli	\N	\N	4	t
450	Misc Luciana	\N	\N	4	t
451	Misc. Anis	\N	\N	4	t
452	Afrutexx	\N	\N	4	t
453	Miscelanea Lucy	\N	\N	4	t
454	El Roble	\N	\N	4	t
455	Misc La Estrella	\N	\N	4	t
456	Misc. El Arbolito	\N	\N	4	t
457	Misc. Alma	\N	\N	4	t
458	Misc. Gil	\N	\N	4	t
459	Tayoltita	\N	\N	4	t
460	Misc Fide	\N	\N	4	t
461	Misc. Morelos	\N	\N	4	t
462	Misc. La Economica	\N	\N	4	t
463	Misc. Alejandra	\N	\N	4	t
464	Misc Tita	\N	\N	4	t
465	Miscelanea Marias	\N	\N	4	t
466	Mini Marquet	\N	\N	4	t
467	Miscelanea Adri	\N	\N	4	t
468	Luciana	\N	\N	4	t
469	Casa Blanca	\N	\N	4	t
470	Cuquita	\N	\N	4	t
471	Miscelanea Alejandra	\N	\N	4	t
472	Miscelane Clau	\N	\N	4	t
473	Miscelanea La Nueva	\N	\N	4	t
474	Doña Rosa	\N	\N	4	t
475	Miscelanea Mayito	\N	\N	4	t
476	La Pasadita	\N	\N	4	t
477	Six Milenio 450	\N	\N	4	t
478	Miscelanea Ale	\N	\N	4	t
479	Miscelanea Imelda	\N	\N	4	t
480	Miscelanea Compaye	\N	\N	4	t
481	Gorditas Yareli	\N	\N	4	t
482	Misc. Elvita Lizeth	\N	\N	4	t
483	Hamburguesas Perlin	\N	\N	5	t
484	Misc y Desechables	\N	\N	5	t
485	Miscelanea Gloria	\N	\N	5	t
486	Miscelanea Marina	\N	\N	5	t
487	Miscelanea Brisa	\N	\N	5	t
488	Miscelanea Martita	\N	\N	5	t
489	Fruteria Fruver	\N	\N	5	t
490	Miscelanea Monte Video	\N	\N	5	t
491	Carniceria Los Laureles	\N	\N	5	t
492	BarbyMar	\N	\N	5	t
493	Miscelanea Clarisa	\N	\N	5	t
494	Miscelanea El Zahuan	\N	\N	5	t
495	Fruteria y Miscelanea La Guayabita	\N	\N	5	t
496	Manuel Mendez Bernal	\N	\N	5	t
497	Miscelanea Mague	\N	\N	5	t
498	Misc Regina	\N	\N	5	t
499	Mini Super Monse	\N	\N	5	t
500	Miscelanea Alan	\N	\N	5	t
501	Misc San Martin	\N	\N	5	t
502	Carniceria Campo Alegre	\N	\N	5	t
503	Miscelanea Ivonne	\N	\N	5	t
504	Miscelanea La Esperanza	\N	\N	5	t
505	Miscelanea Maranatha	\N	\N	5	t
506	Miscelanea El Güero	\N	\N	5	t
507	Miscelanea Nancy	\N	\N	5	t
508	Tortilleria Veronica	\N	\N	5	t
509	Miscelanea Oly	\N	\N	5	t
510	Carniceria Los Laureles	\N	\N	5	t
511	Las Rancheritas	\N	\N	5	t
512	Miscelanea Magda	\N	\N	5	t
513	Miscelanea La Ventanita	\N	\N	5	t
514	Miscelanea Don Manuel	\N	\N	5	t
515	Miscelanea Emireth	\N	\N	5	t
516	Miscelanea Meño	\N	\N	5	t
517	JOSE GILBERTO SERRANO CARBAJAL	\N	\N	5	t
518	Mini Super La Huasteca	\N	\N	5	t
519	Fruteria La Morena	\N	\N	5	t
520	Misc Guadalupe	\N	\N	5	t
521	Super Chemal	\N	\N	5	t
522	Miscelanea El Centavito	\N	\N	5	t
523	La Tienda de Diana	\N	\N	5	t
524	Miscelanea Doña Queta	\N	\N	5	t
525	JOSE MANUEL MIRELES RODRIGUEZ	\N	\N	5	t
526	OLIVIA MORALES ALANIS	\N	\N	5	t
527	Miscelanea Isac	\N	\N	5	t
528	Fruteria El Michoacano Canelas	\N	\N	5	t
529	Flor de Sauco II	\N	\N	5	t
530	Carniceria Rio Florido	\N	\N	5	t
531	Miscelanea Lubya	\N	\N	5	t
532	Big Burro	\N	\N	5	t
533	Six Tecate Dolores del Rio	\N	\N	5	t
534	Miscelanea La Maestra	\N	\N	5	t
535	Miscelanea La Esquinita	\N	\N	5	t
536	Miscelanea Victoria	\N	\N	5	t
537	MIsc Hernandez	\N	\N	5	t
538	Miscelanea La Chiquita	\N	\N	5	t
539	Miscelanea Esmeralda	\N	\N	5	t
540	Miscelanea Itzel	\N	\N	5	t
541	Miscelanea Crisely	\N	\N	5	t
542	Super y Fruteria San Jorge	\N	\N	5	t
543	Super Elian	\N	\N	5	t
544	Miscelanea Montenegro	\N	\N	5	t
545	Fruteria Lupita	\N	\N	5	t
546	Fruteria Olivia (Michoacano)	\N	\N	5	t
547	Miscelanea Dhamar	\N	\N	5	t
548	Miscelanea La Primavera	\N	\N	5	t
549	Super La Manzanita	\N	\N	5	t
550	Mi Tiendita IYAKI	\N	\N	5	t
551	Mini Super Hacienda	\N	\N	5	t
552	Misc Flor de Sauco III	\N	\N	5	t
553	Miscelanea El Sol	\N	\N	5	t
554	Miscelanea Esther	\N	\N	5	t
555	Super y Tortilleria Nataly	\N	\N	5	t
556	Miscelanea El Sol	\N	\N	5	t
557	Misc El Angel	\N	\N	5	t
558	Misc. San Juan Diego	\N	\N	5	t
559	Multiabastos	\N	\N	5	t
560	Misc. Sta. Maria	\N	\N	5	t
561	TKT Six Rodriguez	\N	\N	5	t
562	Tacos Amiguis	\N	\N	5	t
563	Gorditas Canatlan	\N	\N	5	t
564	Fruteria Los Maxis	\N	\N	5	t
565	Fruteria Diana	\N	\N	5	t
566	Don Manuel	\N	\N	5	t
567	Doña Otilia	\N	\N	5	t
568	Misc Manuel	\N	\N	5	t
569	Six	\N	\N	5	t
570	Gorditas Del Real	\N	\N	5	t
571	Hijos De La Guayaba	\N	\N	5	t
572	Andy	\N	\N	5	t
573	Sauces	\N	\N	5	t
574	Misc El Frijolito	\N	\N	5	t
575	Fruteria Y Cremeria Silivia	\N	\N	5	t
576	Tortilleria Sta Cruz	\N	\N	5	t
577	Misc. Daly	\N	\N	5	t
578	Misc Pepes	\N	\N	6	t
579	Mini Super Tapias 2	\N	\N	6	t
580	Mini Super Tapias	\N	\N	6	t
581	Misc Sandoval	\N	\N	6	t
582	Minisuper Angy	\N	\N	6	t
583	Debac's	\N	\N	6	t
584	Miscelanea El Gallo	\N	\N	6	t
585	Super los Alamos	\N	\N	6	t
586	Fruteria Dis-Frutas y Verduras	\N	\N	6	t
587	Miscelanea La Pequena Lulu	\N	\N	6	t
588	Miscelanea Carlitos	\N	\N	6	t
589	Fruteria 5 Hermanos	\N	\N	6	t
590	Misc Elí	\N	\N	6	t
591	Miscelanea Irene	\N	\N	6	t
592	Miscelanea Yessica	\N	\N	6	t
593	Miscelanea Cabral	\N	\N	6	t
594	Miscelanea Las Quince Letras	\N	\N	6	t
595	Miscelanea Kimberly	\N	\N	6	t
596	Miscelanea Lilis	\N	\N	6	t
597	Miscelanea Mary	\N	\N	6	t
598	Misc Teban	\N	\N	6	t
599	Ab El Rosario	\N	\N	6	t
600	Miscelanea Garcia Moctezuma	\N	\N	6	t
601	Misc Kevin	\N	\N	6	t
602	Mini Super Samuel	\N	\N	6	t
603	Comercial Leyva	\N	\N	6	t
604	Mini Super Samuel II	\N	\N	6	t
605	Mini Super Jacarandas	\N	\N	6	t
606	MARIA ERIKA RAMIREZ SOLORZANO	\N	\N	6	t
607	Distribuidora Vazquez	\N	\N	6	t
608	Mini Super Tayoltita	\N	\N	6	t
609	Misc El Campeon	\N	\N	6	t
610	miscelanea rosy	\N	\N	6	t
611	Misc Angy 2	\N	\N	6	t
612	El Prado	\N	\N	6	t
613	La Pasadita	\N	\N	6	t
614	Novedades Liath	\N	\N	6	t
615	Carnicería El Prieto	\N	\N	6	t
616	Miscelánea Mi Ranchito	\N	\N	6	t
617	Cocina Gorditas Lidia	\N	\N	6	t
618	Misc Rosy	\N	\N	6	t
619	Minisuper Angy	\N	\N	6	t
620	Super los Alamos	\N	\N	6	t
621	Pioxo 1	\N	\N	6	t
622	Pioxo 2	\N	\N	6	t
623	Menonas	\N	\N	6	t
624	Avenida	\N	\N	6	t
625	El Supercito	\N	\N	6	t
626	Dayalexia	\N	\N	6	t
627	Zacatecana	\N	\N	6	t
628	Tapias	\N	\N	6	t
629	Las 3 Tías	\N	\N	6	t
630	Tonys	\N	\N	6	t
631	Compañeros	\N	\N	6	t
632	Tk	\N	\N	6	t
633	Angeles	\N	\N	6	t
634	Angel	\N	\N	6	t
635	Misc. Idaly	\N	\N	6	t
636	Misc Anita	\N	\N	6	t
637	Toledo	\N	\N	6	t
638	Anali	\N	\N	6	t
639	Cristy	\N	\N	6	t
640	Alamos	\N	\N	6	t
641	Pinos	\N	\N	6	t
642	Lucero	\N	\N	6	t
643	Misc La Granja	\N	\N	6	t
644	Misc Cumbres	\N	\N	7	t
645	Rommie	\N	\N	7	t
646	Misc Azael	\N	\N	7	t
647	Misc Don Poncho	\N	\N	7	t
648	Super Bolivia	\N	\N	7	t
649	MIRANDA SELECT SA DE CV	\N	\N	7	t
650	Fruteria Miguel	\N	\N	7	t
651	ASOCIACION DE LIMITADOS PARA APOYO A LA COMUNIDAD ALAC	\N	\N	7	t
652	Mini Super Dane	\N	\N	7	t
653	Fruteria Los Gueros	\N	\N	7	t
654	Miscelanea La Joya	\N	\N	7	t
655	Miscelanea Ricky y Marco	\N	\N	7	t
656	Miscelanea La Campesina	\N	\N	7	t
657	Miscelanea Toño	\N	\N	7	t
658	Miscelanea Lidia	\N	\N	7	t
659	Misc Yuli	\N	\N	7	t
660	Miscelánea El Trebol	\N	\N	7	t
661	Santa Catalina	\N	\N	7	t
662	Lulu	\N	\N	7	t
663	La Canasta	\N	\N	7	t
664	Miscelanea Monky	\N	\N	7	t
665	Miscelanea Galvan	\N	\N	7	t
666	Ab Vane	\N	\N	7	t
667	MIGUEL ANGEL PEREZ NAVA	\N	\N	7	t
668	Fruteria Pulgarin	\N	\N	7	t
669	Miscelanea Junior	\N	\N	7	t
670	Miscelanea MyA	\N	\N	7	t
671	Distribuidora Ángel González	\N	\N	7	t
672	Mini Super Rena	\N	\N	7	t
673	Misc El Uriel	\N	\N	7	t
674	Nora Lopez Agudo	\N	\N	7	t
675	Misc Oscar	\N	\N	7	t
676	El Ausente	\N	\N	7	t
677	Frutería Los Güeros	\N	\N	7	t
678	Miscelánea Katán R 7	\N	\N	7	t
679	Misc. Cokin R 7	\N	\N	7	t
680	El Yaky R 7	\N	\N	7	t
681	Fruteria DABA R 7	\N	\N	7	t
682	Miscelanea Quina R 7	\N	\N	7	t
683	Misc. Nazas R 7	\N	\N	7	t
684	Fruteria Lupita R 7	\N	\N	7	t
685	Pasadita R 7	\N	\N	7	t
686	Misc Marcela R 7	\N	\N	7	t
687	Misc Emanuel	\N	\N	7	t
688	Abarrotes Vero R 7	\N	\N	7	t
689	Misc. Marisol R 7	\N	\N	7	t
690	San Juditas	\N	\N	7	t
691	Misc La Chiquita	\N	\N	7	t
692	Puesto Teresa	\N	\N	7	t
693	Misc Cumbres R 7	\N	\N	7	t
694	Misc Yaki II   R7	\N	\N	7	t
695	Misc Don Bara	\N	\N	7	t
696	Misc Jessica	\N	\N	7	t
697	Fruteria Lupita 2	\N	\N	7	t
698	Misc Regina	\N	\N	7	t
699	Six La Chiquita	\N	\N	7	t
700	Misc Varelas	\N	\N	7	t
701	Fruteria Paquito I	\N	\N	7	t
702	Misc Juanita	\N	\N	7	t
703	Misc Andrade	\N	\N	7	t
704	Hot Dogs El Grande	\N	\N	7	t
705	Fruteria Mireles	\N	\N	7	t
706	Misc. Mendez 16	\N	\N	7	t
707	Tortilleria Campo	\N	\N	7	t
708	Puesto Plaza De Toros	\N	\N	7	t
709	Misc. Six Villa	\N	\N	7	t
710	Tienda Hernandez	\N	\N	7	t
711	Misc Kari	\N	\N	7	t
712	Super Torres	\N	\N	7	t
713	Marisol	\N	\N	7	t
714	Misc. Celaya	\N	\N	7	t
715	Misc. Super Fruit	\N	\N	7	t
716	Misc. Versalles	\N	\N	7	t
717	SARA ELIZABETH QUEZADA RODRIGUEZ	\N	\N	7	t
718	Gorditas Chelo	\N	\N	7	t
719	Misc. Lobos	\N	\N	7	t
720	Burros 450	\N	\N	7	t
721	Tienda Sta Ofeli	\N	\N	7	t
722	Misc. Adriana	\N	\N	7	t
723	Misc. Don Toño	\N	\N	7	t
724	Don Toño 2	\N	\N	7	t
725	Misc Reyna	\N	\N	7	t
726	Gorditas y Antojitos	\N	\N	7	t
727	Sazon Ranchero	\N	\N	7	t
728	Burros 450 (2)	\N	\N	8	t
729	Misc Lobos	\N	\N	8	t
730	La Compañera	\N	\N	8	t
731	Don Toño	\N	\N	8	t
732	Mi Tiendita Jose	\N	\N	8	t
733	La Chispa	\N	\N	8	t
734	Burros 450 (1)	\N	\N	8	t
735	Deytan Jt	\N	\N	8	t
736	Misc Lupita	\N	\N	8	t
737	Deytan Jt 2	\N	\N	8	t
738	Misc Victor	\N	\N	8	t
739	Deytan	\N	\N	8	t
740	Tecate Six	\N	\N	8	t
741	Misc Lucy	\N	\N	8	t
742	Misc Morita	\N	\N	8	t
743	Six Alicia	\N	\N	8	t
744	Las Flores	\N	\N	8	t
745	Tortas Angel	\N	\N	8	t
746	Frutería Diana	\N	\N	8	t
747	La Manzanita	\N	\N	8	t
748	El Mercadito	\N	\N	8	t
749	Codigo Disponible	\N	\N	8	t
750	Misc Denisse	\N	\N	8	t
751	Mini Super Bm	\N	\N	8	t
752	Cremería Mimi	\N	\N	8	t
753	Misc Lupita	\N	\N	8	t
754	Codigo Disponible	\N	\N	8	t
755	Misc Kevin	\N	\N	8	t
756	Six Villa 7	\N	\N	8	t
757	Codigo Disponible	\N	\N	8	t
758	Misc Cecy	\N	\N	8	t
759	Codigo Disponible	\N	\N	8	t
760	Codigo Disponible	\N	\N	8	t
761	Codigo Disponible	\N	\N	8	t
762	Codigo Disponible	\N	\N	8	t
763	Codigo Disponible	\N	\N	8	t
764	Codigo Disponible	\N	\N	8	t
765	Codigo Disponible	\N	\N	8	t
766	Codigo Disponible	\N	\N	8	t
767	Codigo Disponible	\N	\N	8	t
768	Codigo Disponible	\N	\N	8	t
769	Codigo Disponible	\N	\N	8	t
770	Misc Pau	\N	\N	8	t
771	Codigo Disponible	\N	\N	8	t
772	Codigo Disponible	\N	\N	8	t
773	Codigo Disponible	\N	\N	8	t
774	Codigo Disponible	\N	\N	8	t
775	Miscelanea Sol R 8	\N	\N	8	t
776	Miscelánea Thaly R 8	\N	\N	8	t
777	Misc Angelitos R 8	\N	\N	8	t
778	Los Girasoles	\N	\N	8	t
779	Fruteria Mirac	\N	\N	8	t
780	Flor Del Ángel	\N	\N	8	t
781	Super y Carniceria Chiquis	\N	\N	8	t
782	Doña Tencha	\N	\N	8	t
783	El Milagrito	\N	\N	8	t
784	Miscelanea Hugo	\N	\N	8	t
785	Carnicería El Piolin	\N	\N	8	t
786	Misc Issabela	\N	\N	8	t
787	Miscelanea Rich	\N	\N	8	t
788	Misc  El Rosal	\N	\N	8	t
789	JESUS JASSO	\N	\N	8	t
790	Mejor Carne	\N	\N	8	t
791	Mini Super Gemelas	\N	\N	8	t
792	Tkt Alicia	\N	\N	8	t
793	Super Guty	\N	\N	8	t
794	Misc. Cely	\N	\N	8	t
795	Misc Miranda	\N	\N	8	t
796	Misc. Perlita	\N	\N	8	t
797	Miscelanea El Porvenir	\N	\N	8	t
798	La Coquena	\N	\N	8	t
799	Miscelanea KIMMAR	\N	\N	8	t
800	Mini Super Juanito	\N	\N	8	t
801	Misc Junior	\N	\N	8	t
802	La Villita	\N	\N	8	t
803	Misc Misael	\N	\N	8	t
804	Misc Los Pinos	\N	\N	8	t
805	Miscelanea Susy	\N	\N	8	t
806	GUADALUPE PONCE RIVERA	\N	\N	8	t
807	Mini Super Zaragoza	\N	\N	8	t
808	Ale	\N	\N	8	t
809	Misc Los Pepes	\N	\N	8	t
810	Misc Tere	\N	\N	8	t
811	Misc. Kaly	\N	\N	8	t
812	Burros 450 (1)	\N	\N	8	t
813	Gorditas San Bigotes	\N	\N	8	t
814	Misc. Susy	\N	\N	8	t
815	Misc. San Judas	\N	\N	8	t
816	LISVANY MARRERO HURTADO	\N	\N	8	t
817	Tienda Doña Maria	\N	\N	8	t
818	Miscelanea Andrea	\N	\N	8	t
819	Miscelanea Lorens	\N	\N	8	t
820	Misc. Güero	\N	\N	8	t
821	Six Villa Unión	\N	\N	8	t
822	Amor De Familia	\N	\N	8	t
823	Misc. Rosy	\N	\N	8	t
824	Misc Coquito	\N	\N	8	t
825	Fruteria Nubes	\N	\N	9	t
826	Mayra Guadalupe Herrera Olguín	\N	\N	9	t
827	Mini Super Atenas	\N	\N	9	t
828	Tienda Dane	\N	\N	9	t
829	Miscelanea Doña Pina	\N	\N	9	t
830	Miscelanea Oliver	\N	\N	9	t
831	Misc Dane	\N	\N	9	t
832	La Hacienda	\N	\N	9	t
833	Carniceria EL Mesteño	\N	\N	9	t
834	Misc La Pasadita	\N	\N	9	t
835	EL Caporal	\N	\N	9	t
836	Miscelanea La Esquina	\N	\N	9	t
837	Miscelanea Ariel	\N	\N	9	t
838	Mini Super Dey Tan	\N	\N	9	t
839	JAIME ALEXIS SOTO IBARRA	\N	\N	9	t
840	Miscelanea Mina	\N	\N	9	t
841	Super BM	\N	\N	9	t
842	Misc Viri	\N	\N	9	t
843	Miscelanea Sarahi	\N	\N	9	t
844	Miscelanea Trebol	\N	\N	9	t
845	Misc Iveth	\N	\N	9	t
846	Carniceria Carna T Mart	\N	\N	9	t
847	Miscelanea Rubi	\N	\N	9	t
848	Super y Carniceria Mares	\N	\N	9	t
849	Miscelanea Sammy	\N	\N	9	t
850	MiniSuper Morquechito	\N	\N	9	t
851	Misc La Chinita	\N	\N	9	t
852	Miscelanea torres	\N	\N	9	t
853	Misc Rayito	\N	\N	9	t
854	Miscelanea Susy	\N	\N	9	t
855	Miscelanea Las Gemelas	\N	\N	9	t
856	Miscelanea Brenda	\N	\N	9	t
857	Mini Super Villas	\N	\N	9	t
858	Misc. Don Cruz	\N	\N	9	t
859	Misc Chepe	\N	\N	9	t
860	Mini super Aguas con el Gato	\N	\N	9	t
861	Tortilleria Grijalba I	\N	\N	9	t
862	Miscelanea La Escondida	\N	\N	9	t
863	Miscelanea Hugo	\N	\N	9	t
864	Miscelanea KIMMAR	\N	\N	9	t
865	Carniceria El Roble	\N	\N	9	t
866	GUADALUPE PONCE RIVERA	\N	\N	9	t
867	JUAN PEDRO CORDOVA HERNANDEZ	\N	\N	9	t
868	Miscelanea San Jose	\N	\N	9	t
869	Miscelanea Luis	\N	\N	9	t
870	Miscelanea Lizeth	\N	\N	9	t
871	Miscelanea 20 de Noviembre	\N	\N	9	t
872	Miscelanea el Paisita	\N	\N	9	t
873	Miscelanea Andrea	\N	\N	9	t
874	Miscelanea Kevin	\N	\N	9	t
875	NARCISO ESCOBAR SANCHEZ	\N	\N	9	t
876	Miscelanea La Ventanita	\N	\N	9	t
877	Mini Super Genesis	\N	\N	9	t
878	Mini Super Zaragoza	\N	\N	9	t
879	importaciones Mimi	\N	\N	9	t
880	Misc Katia	\N	\N	9	t
881	Cabegogo	\N	\N	9	t
882	Gorditas La Chata	\N	\N	9	t
883	Miscelanea Quintana	\N	\N	9	t
884	Miscelanea La Escondida	\N	\N	9	t
885	Miscelanea Los Pinos	\N	\N	9	t
886	Miscelanea Niconsa	\N	\N	9	t
887	Abarrotes La Cona	\N	\N	9	t
888	Misc Alma	\N	\N	9	t
889	Miscelanea Mis Princesitas	\N	\N	9	t
890	JOSE MANUEL MIRELES RODRIGUEZ	\N	\N	9	t
891	Misc Don Pepe	\N	\N	9	t
892	Misc Cris	\N	\N	9	t
893	Mini Super El Sebas	\N	\N	9	t
894	Gorditas Las Vecinas	\N	\N	9	t
895	NANCY ALMEIDA ZAPATA	\N	\N	9	t
896	Encinos	\N	\N	9	t
897	Mis A Y Fe	\N	\N	9	t
898	Tecate	\N	\N	9	t
899	Miscelanea Rich	\N	\N	9	t
900	Ale	\N	\N	9	t
901	Buen Dia	\N	\N	9	t
902	GUADALUPE PONCE RIVERA	\N	\N	9	t
903	TERESA ISELA SOTO IBARRA	\N	\N	9	t
904	Victor	\N	\N	9	t
905	Deytan	\N	\N	9	t
906	Tkt Six Duraznos	\N	\N	9	t
907	MARTHA YADIRA SANCHEZ CAVAZOS	\N	\N	9	t
908	Misc. Las Conchitas	\N	\N	9	t
909	La Tiendita	\N	\N	9	t
910	Misc. Coco	\N	\N	9	t
911	Misc Joms	\N	\N	10	t
912	Misc Gina	\N	\N	10	t
913	Misc Dolly	\N	\N	10	t
914	Codigo Disponible	\N	\N	10	t
915	Codigo Disponible	\N	\N	10	t
916	Fruteria y Cremeria	\N	\N	10	t
917	Codigo Disponible	\N	\N	10	t
918	Codigo Disponible	\N	\N	10	t
919	Codigo Disponible	\N	\N	10	t
920	Codigo Disponible	\N	\N	10	t
921	Codigo Disponible	\N	\N	10	t
922	Codigo Disponible	\N	\N	10	t
923	Codigo Disponible	\N	\N	10	t
924	Codigo Disponible	\N	\N	10	t
925	Codigo Disponible	\N	\N	10	t
926	Codigo Disponible	\N	\N	10	t
927	Codigo Disponible	\N	\N	10	t
928	Codigo Disponible	\N	\N	10	t
929	Codigo Disponible	\N	\N	10	t
930	Codigo Disponible	\N	\N	10	t
931	Codigo Disponible	\N	\N	10	t
932	Codigo Disponible	\N	\N	10	t
933	Codigo Disponible	\N	\N	10	t
934	Codigo Disponible	\N	\N	10	t
935	Codigo Disponible	\N	\N	10	t
936	Codigo Disponible	\N	\N	10	t
937	Codigo Disponible	\N	\N	10	t
938	Codigo Disponible	\N	\N	10	t
939	Codigo Disponible	\N	\N	10	t
940	Codigo Disponible	\N	\N	10	t
941	Codigo Disponible	\N	\N	10	t
942	Codigo Disponible	\N	\N	10	t
943	Codigo Disponible	\N	\N	10	t
944	Codigo Disponible	\N	\N	10	t
945	Codigo Disponible	\N	\N	10	t
946	Codigo Disponible	\N	\N	10	t
947	Codigo Disponible	\N	\N	10	t
948	Codigo Disponible	\N	\N	10	t
949	Codigo Disponible	\N	\N	10	t
950	Codigo Disponible	\N	\N	10	t
951	Codigo Disponible	\N	\N	10	t
952	Codigo Disponible	\N	\N	10	t
953	Codigo Disponible	\N	\N	10	t
954	Codigo Disponible	\N	\N	10	t
955	Codigo Disponible	\N	\N	10	t
956	Codigo Disponible	\N	\N	10	t
957	Codigo Disponible	\N	\N	10	t
958	Codigo Disponible	\N	\N	10	t
959	Codigo Disponible	\N	\N	10	t
960	Codigo Disponible	\N	\N	10	t
961	Codigo Disponible	\N	\N	10	t
962	Codigo Disponible	\N	\N	10	t
963	Codigo Disponible	\N	\N	10	t
964	Codigo Disponible	\N	\N	10	t
965	Codigo Disponible	\N	\N	10	t
966	Codigo Disponible	\N	\N	10	t
967	Codigo Disponible	\N	\N	10	t
968	Codigo Disponible	\N	\N	10	t
969	El Compaye	\N	\N	10	t
970	La Pasadita	\N	\N	11	t
971	Primos 1	\N	\N	11	t
972	Primos 3	\N	\N	11	t
973	Misc Rabchito	\N	\N	11	t
974	Misc Todo al Paso	\N	\N	11	t
975	La Pequeña	\N	\N	11	t
976	La Ventanita	\N	\N	11	t
977	Las Palmas	\N	\N	11	t
978	Maria De Los Angeles Jimenez R	\N	\N	11	t
979	Mini Super Lupita	\N	\N	11	t
980	Frutería y Cremería El Abuelo	\N	\N	11	t
981	Misc Las Dos Primas	\N	\N	11	t
982	Miscelanea Nevarez	\N	\N	11	t
983	El Surtidito	\N	\N	11	t
984	Comida	\N	\N	11	t
985	Super Paola	\N	\N	11	t
986	MA. GRACIELA CASTRO QUIÑONES	\N	\N	11	t
987	Misc La Victoria	\N	\N	11	t
988	Dulceria Mague	\N	\N	11	t
989	Misc Norma	\N	\N	11	t
990	Super La Abejita	\N	\N	11	t
991	Miscelanea Yarel	\N	\N	11	t
992	Miscelanea Martha	\N	\N	11	t
993	Carniceria Luis	\N	\N	11	t
994	Cremería La Villa	\N	\N	11	t
995	Miscelanea Linda	\N	\N	11	t
996	Susana	\N	\N	11	t
997	Las Gemelas	\N	\N	11	t
998	Misc Chepita	\N	\N	11	t
999	Miscelanea El Cisne Negro	\N	\N	11	t
1000	Misc La Favorita	\N	\N	11	t
1001	Carniceria Palomares	\N	\N	11	t
1002	Tortilleria El Platillo Volador	\N	\N	11	t
1003	Ab Victoria	\N	\N	11	t
1004	Gorditas La Doña	\N	\N	11	t
1005	Super Medrano	\N	\N	11	t
1006	Miscelanea Karla	\N	\N	11	t
1007	Miscelanea San Juditas Tadeo	\N	\N	11	t
1008	Abarrotes Gurrola Ii	\N	\N	11	t
1009	Miscelanea Pepes	\N	\N	11	t
1010	Super Lolis	\N	\N	11	t
1011	Narciso Arce Martinez	\N	\N	11	t
1012	Miscelanea Gaby	\N	\N	11	t
1013	Gordita Zacatecas	\N	\N	11	t
1014	Don Chive	\N	\N	11	t
1015	Mini Súper	\N	\N	11	t
1016	Miscelanea Alessandra	\N	\N	11	t
1017	Miscelanea Rayo II	\N	\N	11	t
1018	Mini Super Gonzalez	\N	\N	11	t
1019	Six Leopoldo	\N	\N	11	t
1020	Miscelanea Perla	\N	\N	11	t
1021	Mini Super La Chiquita Jr	\N	\N	11	t
1022	Miscelanea La Chiquita	\N	\N	11	t
1023	Miscelanea Janeth	\N	\N	11	t
1024	Miscelanea Lago	\N	\N	11	t
1025	Fruteria LMC	\N	\N	11	t
1026	Miscelanea Liz	\N	\N	11	t
1027	Miscelanea El Gordito	\N	\N	11	t
1028	Abarrotes y Mas Jacaranda	\N	\N	11	t
1029	LETICIA LIRA LUCERO	\N	\N	11	t
1030	Fruteria Rivas	\N	\N	11	t
1031	Miscelanea La Colmena	\N	\N	11	t
1032	Miscelanea Viky	\N	\N	11	t
1033	Tres Hermanos	\N	\N	11	t
1034	Miscelanea Luna	\N	\N	11	t
1035	Carniceria La Sorpresa	\N	\N	11	t
1036	Miscelanea Providencia	\N	\N	11	t
1037	Carniceria El Chicharito	\N	\N	11	t
1038	Miscelanea Omega	\N	\N	11	t
1039	Miscelanea Susy	\N	\N	11	t
1040	Mini Super Don Ese y Don Ciri	\N	\N	11	t
1041	Misc Gandara	\N	\N	11	t
1042	Mini Super Ibarra	\N	\N	11	t
1043	Miscelanea Lupita	\N	\N	11	t
1044	Miscelanea Fabiola	\N	\N	11	t
1045	Miscelanea Cris	\N	\N	11	t
1046	Miscelanea Alan	\N	\N	11	t
1047	Misc Keily	\N	\N	11	t
1048	Miscelánea Jazmin	\N	\N	11	t
1049	Misc Odil	\N	\N	11	t
1050	Miscelánea Gavilanes	\N	\N	11	t
1051	Abarrotes Gurrola	\N	\N	11	t
1052	Miscelanea Lili	\N	\N	11	t
1053	Sushingadas Gordas	\N	\N	11	t
1054	Miscelanea Y Papelería Nancy	\N	\N	11	t
1055	Miscelanea Armandito	\N	\N	11	t
1056	ARTURO IRVIN SALAZAR GARCIA	\N	\N	11	t
1057	minisuper villa de guadalupe	\N	\N	11	t
1058	miscelanea la tiendita	\N	\N	11	t
1059	Misc Lupita	\N	\N	11	t
1060	Miscelanea Mia	\N	\N	11	t
1061	Miscelánea Perla	\N	\N	11	t
1062	Misc Don Chuy	\N	\N	11	t
1063	Frutería Chiquis	\N	\N	11	t
1064	Minisuper Cardoza	\N	\N	11	t
1065	Miscelanea Estrella	\N	\N	11	t
1066	Miscelanea Y Panadería Arsabin	\N	\N	11	t
1067	Miscelanea González	\N	\N	11	t
1068	Six 8 La Virgen	\N	\N	11	t
1069	Miscelánea La Galaxia	\N	\N	11	t
1070	Doña Aurora	\N	\N	11	t
1071	Miscelánea Salas	\N	\N	11	t
1072	Fruteria La Poblana	\N	\N	11	t
1073	Miscelánea Angelito	\N	\N	11	t
1074	miscelánea juanita	\N	\N	11	t
1075	Miscelánea cristina	\N	\N	11	t
1076	Miscelánea Chelo	\N	\N	11	t
1077	Miscelánea Yuli	\N	\N	11	t
1078	Super Zulma	\N	\N	11	t
1079	La Guadalupana	\N	\N	11	t
1080	Misc La Pasadita	\N	\N	11	t
1081	Miscelánea Esmeralda	\N	\N	11	t
1082	Abarrotes Torres	\N	\N	11	t
1083	Fundacion Vale Vida Amor Luz Esperanza A.C.	\N	\N	11	t
1084	Miscelánea Encino	\N	\N	11	t
1085	Miscelanea el Salvador	\N	\N	11	t
1086	Misc Chimin	\N	\N	11	t
1087	Misc Niky	\N	\N	11	t
1088	Abarrotes Cristy	\N	\N	11	t
1089	Misc Elias	\N	\N	11	t
1090	MA. INES APARICIO LOERA	\N	\N	11	t
1091	Enrique 2	\N	\N	11	t
1092	Te	\N	\N	11	t
1093	Ventanita	\N	\N	11	t
1094	Dulce	\N	\N	11	t
1095	Six Morga	\N	\N	11	t
1096	Misc Britany	\N	\N	11	t
1097	Maquinitas Paty	\N	\N	11	t
1098	Misc. Gaby	\N	\N	11	t
1099	Puesto Mary	\N	\N	11	t
1100	Abarrotes Doki	\N	\N	11	t
1101	Misc Los Primos II	\N	\N	11	t
1102	Misc Quiñones	\N	\N	11	t
1103	Abarrotes Roldan	\N	\N	11	t
1104	Miscelánea Aly	\N	\N	12	t
1105	Minisuper El Capi	\N	\N	12	t
1106	Frutería Nazas	\N	\N	12	t
1107	Frutería Lupita	\N	\N	12	t
1108	Miscelánea Regina	\N	\N	12	t
1109	Miscelánea El Anguinaldo	\N	\N	12	t
1110	Miscelánea Mi Tiendita	\N	\N	12	t
1111	Minisuper Bonnie	\N	\N	12	t
1112	Miscelánea Mary	\N	\N	12	t
1113	Frutería Rodarte	\N	\N	12	t
1114	Frutería El Charrito	\N	\N	12	t
1115	Frutería Mg	\N	\N	12	t
1116	Miscelánea Kevin	\N	\N	12	t
1117	Miscelánea Chelo	\N	\N	12	t
1118	Miscelánea Carlitos	\N	\N	12	t
1119	Frutería El Paraíso	\N	\N	12	t
1120	Miscelánea Portillo	\N	\N	12	t
1121	Misceláneaa 4 Hermanos	\N	\N	12	t
1122	Miscelánea La Privada	\N	\N	12	t
1123	Miscelánea La Flor	\N	\N	12	t
1124	Miscelánea Cariño	\N	\N	12	t
1125	Miscelánea Yoyis	\N	\N	12	t
1126	Misceláneaa Los Abuelitos	\N	\N	12	t
1127	Frutería La Canasta	\N	\N	12	t
1128	Misceláneaa Emireth	\N	\N	12	t
1129	Miscelánea Eva	\N	\N	12	t
1130	Miscelánea Nina	\N	\N	12	t
1131	Mi Changarrito	\N	\N	12	t
1132	Miscelánea Rubí	\N	\N	12	t
1133	Six Maximo	\N	\N	12	t
1134	Miscelánea Del Sabor	\N	\N	12	t
1135	Miscelánea Los Angeles	\N	\N	12	t
1136	RAMSES VAZQUEZ RODRIGUEZ	\N	\N	13	t
1137	GLORIA MARTINEZ PEREZ	\N	\N	13	t
1138	ERNESTO SALAZAR CANDIA	\N	\N	13	t
1139	PAN LA PAZ DURANGO	\N	\N	13	t
1140	Codigo Disponible 1	\N	\N	13	t
1141	Codigo Disponible 2	\N	\N	13	t
1142	Codigo Disponible 3	\N	\N	13	t
1143	Codigo Disponible 4	\N	\N	13	t
1144	Codigo Disponible 5	\N	\N	13	t
1145	Fruteria Keyli	\N	\N	13	t
1146	Frut. El Aguacatito	\N	\N	13	t
1147	Misc. Hannis	\N	\N	13	t
1148	Fruteria Express	\N	\N	13	t
1149	Ekonomica	\N	\N	13	t
1150	Fruteria Mercado	\N	\N	13	t
1151	Los Perrones	\N	\N	13	t
1152	Dulceria Abejita	\N	\N	13	t
1153	Abarrotes Luna	\N	\N	13	t
1154	Abarrotes Luna 2	\N	\N	13	t
1155	Don Adan	\N	\N	13	t
1156	Fruteria	\N	\N	13	t
1157	Misc. Beltran	\N	\N	13	t
1158	Gorditas Ymas	\N	\N	13	t
1159	Tecate Bolivia	\N	\N	13	t
1160	El Bodegon	\N	\N	13	t
1161	Gorditas La Sierra	\N	\N	13	t
1162	Carniceria San Fco	\N	\N	13	t
1163	Fruteria Y Cremeria	\N	\N	13	t
1164	Central De Frutas	\N	\N	13	t
1165	Super Tianguis 33	\N	\N	13	t
1166	MaxiFrut Jardines	\N	\N	16	t
1167	YAEL FARID VAZQUEZ ORTIZ	\N	\N	16	t
1168	MaxiFrut Infonavit	\N	\N	16	t
1169	Fruteria Maxi Frut	\N	\N	16	t
1170	Ecococina	\N	\N	16	t
1171	ABARROTES VENEGAS	\N	\N	16	t
1172	HUGO EMMANUEL TERAN MARTINEZ	\N	\N	16	t
1173	Fruteria y Cremeria Genesis	\N	\N	16	t
1174	Pays Maria de Jesus	\N	\N	16	t
1175	ABARROTES VENEGAS	\N	\N	16	t
1176	El Milagro	\N	\N	16	t
1177	Los Gomez	\N	\N	16	t
1178	Tortas Tec	\N	\N	16	t
1179	Gorditas Citlali	\N	\N	16	t
1180	Tacos El Caminero	\N	\N	16	t
1181	Misc. Anis	\N	\N	16	t
1182	Misc. Alba	\N	\N	16	t
1183	LOS SENDEROS	\N	\N	16	t
1184	La Española	\N	\N	16	t
1185	Las Calandrias	\N	\N	16	t
1186	Teleperformance	\N	\N	16	t
1187	Caminero Ii	\N	\N	16	t
1188	MIRANDA SELECT SA DE CV	\N	\N	16	t
1189	Super Chino	\N	\N	16	t
1190	Super Zoraida	\N	\N	16	t
1191	Gorditas Nombre De Dios	\N	\N	16	t
1192	Super Jolios	\N	\N	16	t
1193	Afrutexx	\N	\N	16	t
1194	El Roble	\N	\N	16	t
1195	Misc. Juanita	\N	\N	16	t
1196	Misc. La Yuca	\N	\N	16	t
1197	Café Bosco	\N	\N	16	t
1198	Super El Chino Ii	\N	\N	16	t
1199	Dados Pizza	\N	\N	16	t
1200	Super Jolios	\N	\N	16	t
1201	Fruteria Genesis	\N	\N	16	t
1202	Carniceria Marmaloeo	\N	\N	17	t
1203	Laura Belem	\N	\N	17	t
1204	CENTRO DE RECURSOS DE ASISTENCIA FAMILIAR	\N	\N	17	t
1205	GUSTAVO EDUARDO LOPEZ CASTAÑEDA	\N	\N	17	t
1206	Misc Menis	\N	\N	17	t
1207	Fruteria del Campo	\N	\N	17	t
1208	Miscelanea Dani	\N	\N	17	t
1209	Miselanea Chiquihuites	\N	\N	17	t
1210	Miscelanea El Guero	\N	\N	17	t
1211	Yolanda Burciaga Contreras	\N	\N	17	t
1212	Miscelanea La Regional	\N	\N	17	t
1213	Miscelanea El Clip	\N	\N	17	t
1214	Miscelanea Angelita	\N	\N	17	t
1215	Miscelanea zonic	\N	\N	17	t
1216	El Buen Comer	\N	\N	17	t
1217	Miscelanea Flor de Sauco	\N	\N	17	t
1218	Miscelanea San Fernando	\N	\N	17	t
1219	Super´s Rivera 1	\N	\N	17	t
1220	Miscelanea Esperanza	\N	\N	17	t
1221	Misc Ericka	\N	\N	17	t
1222	Tecate Six	\N	\N	17	t
1223	Supercito de Sauco	\N	\N	17	t
1224	Miscelanea Joselin	\N	\N	17	t
1225	Miscelanea Garay	\N	\N	17	t
1226	DANIEL RICARDO RODRIGUEZ MIRELES	\N	\N	17	t
1227	Super Valerie	\N	\N	17	t
1228	Msicelanea Ariana	\N	\N	17	t
1229	Carniceria San Martin	\N	\N	17	t
1230	Miscelanea Liz	\N	\N	17	t
1231	Super San Antonio	\N	\N	17	t
1232	Misc Rivera 4	\N	\N	17	t
1233	Promedac	\N	\N	17	t
1234	Lonches 110	\N	\N	17	t
1235	Super´s Rivera 2	\N	\N	17	t
1236	Super´s Rivera 3	\N	\N	17	t
1237	Distribuidora Cavamez	\N	\N	17	t
1238	Codigo Disponible 3	\N	\N	17	t
1239	Misc Rocio	\N	\N	17	t
1240	Misc. Vero	\N	\N	17	t
1241	Misc. El Compañero	\N	\N	17	t
1242	Gorditas San Jose	\N	\N	17	t
1243	Gorditas San Pedro	\N	\N	17	t
1244	Misc. Fenix	\N	\N	17	t
1245	FRANCISCA RODRIGUEZ GURROLA	\N	\N	17	t
1246	Misc. La Kokena	\N	\N	17	t
1247	Misc. Wendy	\N	\N	17	t
1248	Super Muñoz	\N	\N	17	t
1249	Misc. Benito	\N	\N	17	t
1250	Misc.Deytan	\N	\N	17	t
1251	Fruteria Lupita	\N	\N	17	t
1252	Fruteria Gera I	\N	\N	17	t
1253	Mini Super Kimi	\N	\N	17	t
1254	Misc. G. Pollo	\N	\N	17	t
1255	Misc. Juanita	\N	\N	17	t
1256	Misc. Gonzalez	\N	\N	17	t
1257	Misc. Manuel	\N	\N	17	t
1258	Misc. Alondra	\N	\N	17	t
1259	San Diego 3	\N	\N	17	t
1260	Fruteria Gera 3	\N	\N	17	t
1261	El Compañero	\N	\N	17	t
1262	Gorditas Gpe	\N	\N	17	t
1263	Gordad Gpe 2	\N	\N	17	t
1264	Super 7	\N	\N	17	t
1265	Lonches Laguna	\N	\N	17	t
1266	Misc. Faby	\N	\N	17	t
1267	Misc. Salcido	\N	\N	17	t
1268	MIGUEL ANGEL REYES MUÑOZ	\N	\N	17	t
1269	San Diego I	\N	\N	17	t
1270	Super Estrella	\N	\N	17	t
1271	San Diego 2	\N	\N	17	t
1272	Misc. La Maestra	\N	\N	17	t
1273	Misc. Lizeth	\N	\N	17	t
1274	Fruteria El Manguito	\N	\N	17	t
1275	ROSA MARGARITA GARCIA PEREZ	\N	\N	17	t
1276	Gorditas La Palma	\N	\N	17	t
1277	Fruteria Gera 2	\N	\N	17	t
1278	Pais	\N	\N	17	t
1279	Misc. La Escondida	\N	\N	17	t
1280	Gorditas Naty	\N	\N	17	t
1281	Misc. Lety	\N	\N	17	t
1282	Mini Super el Regocijo	\N	\N	17	t
1283	Misc. California	\N	\N	17	t
1284	Gortitas Maru	\N	\N	17	t
1285	Misc Quintas	\N	\N	17	t
1286	Misc Ingeniero	\N	\N	17	t
1287	Misc La Estrella	\N	\N	18	t
1288	Miscelanea Brisa	\N	\N	18	t
1289	Abarrotes Castillo	\N	\N	18	t
1290	Miscelanea Martinez	\N	\N	18	t
1291	Desayunos Eva	\N	\N	18	t
1292	Misc Lea	\N	\N	18	t
1293	Miscelanea Fenix de Plata	\N	\N	18	t
1294	Tayoltita II	\N	\N	18	t
1295	Misc Rosita	\N	\N	18	t
1296	Misc Charly's	\N	\N	18	t
1297	Six Veronica Simental	\N	\N	18	t
1298	CELIK BIBIANA ROMERO PARRA BARRIENTOS	\N	\N	18	t
1299	Misc Luna	\N	\N	18	t
1300	Misc La Frontera	\N	\N	18	t
1301	Dulcería Haro	\N	\N	18	t
1302	Misc La Esquina	\N	\N	18	t
1303	Misc Martínez	\N	\N	18	t
1304	Misc El Toro	\N	\N	18	t
1305	Misc Chaparrita	\N	\N	18	t
1306	Fruteria Los Montes	\N	\N	18	t
1307	Misc Itzel	\N	\N	18	t
1308	Carniceria Junior	\N	\N	18	t
1309	Misc Loma Bonita	\N	\N	18	t
1310	Misc Bebocho	\N	\N	18	t
1311	Minisuper Carlita	\N	\N	18	t
1312	Carnicería El Encinal	\N	\N	18	t
1313	Miscelanea Bugambilias	\N	\N	18	t
1314	Misc Chabelita	\N	\N	18	t
1315	Misc Leon	\N	\N	18	t
1316	Misc Melanie	\N	\N	18	t
1317	Jose Rodriguez Quezada	\N	\N	18	t
1318	Fruteria y Abarrotes Ale	\N	\N	18	t
1319	FLOR JANETTE RODRIGUEZ FLORES	\N	\N	18	t
1320	Miscelanea Yola	\N	\N	18	t
1321	Abarrotes Zamora	\N	\N	18	t
1322	Miscelanea Mi Caramelito	\N	\N	18	t
1323	Tec Mini Super 3	\N	\N	18	t
1324	Miscelanea Regina	\N	\N	18	t
1325	Misc Las Rosas	\N	\N	18	t
1326	Misc. Jank Verde	\N	\N	18	t
1327	Misc Fidel	\N	\N	18	t
1328	Misc. Jaqueline	\N	\N	18	t
1329	Fruteria La Manzanita	\N	\N	18	t
1330	MiniSuper La Colonia	\N	\N	18	t
1331	Chato	\N	\N	18	t
1332	Los Changos	\N	\N	18	t
1333	El Triangulo	\N	\N	18	t
1334	Tienda 3 Hermanos	\N	\N	18	t
1335	Misc. Eder	\N	\N	18	t
1336	La Chozita	\N	\N	18	t
1337	Gordas Mari	\N	\N	18	t
1338	Misc Chibli	\N	\N	18	t
1339	Gorditas Cuautemoc	\N	\N	18	t
1340	Misc. El Arbolito	\N	\N	18	t
1341	Panaderia Belen	\N	\N	18	t
1342	Misc. Alma	\N	\N	18	t
1343	Gorditas El Recuerdo	\N	\N	18	t
1344	Fruteria Esperanza	\N	\N	18	t
1345	OSVALDO CASTRO FLORES	\N	\N	18	t
1346	Gorditas Adela	\N	\N	18	t
1347	Gorditas Patitos	\N	\N	18	t
1348	Misc. Miriam	\N	\N	18	t
1349	Misc. Anita	\N	\N	18	t
1350	Misc. Morena	\N	\N	18	t
1351	Misc. Idaly	\N	\N	18	t
1352	Gorditas Chonita	\N	\N	18	t
1353	Super Rosy	\N	\N	18	t
1354	Super El Viajero	\N	\N	18	t
1355	Fruteria Huerto Verde	\N	\N	18	t
1356	Gorditas La Flor	\N	\N	18	t
1357	Misc. Consuelo	\N	\N	18	t
1358	Gorditas Napy	\N	\N	18	t
1359	Carniceria	\N	\N	18	t
1360	Misc. La Economica	\N	\N	18	t
1361	Misc. Alejandra	\N	\N	18	t
1362	Gorditas Cuitlahuac	\N	\N	18	t
1363	Misc. Mary	\N	\N	18	t
1364	Misc. Rosy	\N	\N	18	t
1365	Misc. Gus	\N	\N	18	t
1366	Mi Tiendita	\N	\N	18	t
1367	Misc. Del Real	\N	\N	18	t
1368	Misc. Calixto	\N	\N	18	t
1369	Mega Gordas	\N	\N	18	t
1370	Misc. Juanita	\N	\N	18	t
1371	Fruteria Mireles	\N	\N	18	t
1372	Misc. Cami	\N	\N	18	t
1373	Fruteria Paola	\N	\N	18	t
1374	Carniceria Hm	\N	\N	18	t
1375	Misc. Rosy	\N	\N	18	t
1376	Mi Tiendita	\N	\N	18	t
1377	Gorditas Faty	\N	\N	18	t
1378	Mics. Julisa	\N	\N	18	t
1379	Misc Zani	\N	\N	18	t
1380	Six	\N	\N	18	t
1381	Trebol	\N	\N	18	t
1382	Ruben	\N	\N	18	t
1383	Las Gemelas	\N	\N	19	t
1384	Fruteria Villareal	\N	\N	19	t
1385	Esparza	\N	\N	19	t
1386	Jovita	\N	\N	19	t
1387	FRUTERIA Y CREMERIA EL ARBOL FRONDOSO	\N	\N	19	t
1388	Codigo Disponible	\N	\N	19	t
1389	Codigo Disponible	\N	\N	19	t
1390	Fruteria Nubes	\N	\N	19	t
1391	Codigo Disponible	\N	\N	19	t
1392	Codigo Disponible	\N	\N	19	t
1393	Codigo Disponible	\N	\N	19	t
1394	Codigo Disponible	\N	\N	19	t
1395	Codigo Disponible	\N	\N	19	t
1396	Codigo Disponible	\N	\N	19	t
1397	Codigo Disponible	\N	\N	19	t
1398	Codigo Disponible	\N	\N	19	t
1399	Codigo Disponible	\N	\N	19	t
1400	Codigo Disponible	\N	\N	19	t
1401	Codigo Disponible	\N	\N	19	t
1402	Codigo Disponible	\N	\N	19	t
1403	Codigo Disponible	\N	\N	19	t
1404	Codigo Disponible	\N	\N	19	t
1405	Codigo Disponible	\N	\N	19	t
1406	Codigo Disponible	\N	\N	19	t
1407	Codigo Disponible	\N	\N	19	t
1408	Codigo Disponible	\N	\N	19	t
1409	Codigo Disponible	\N	\N	19	t
1410	Codigo Disponible	\N	\N	19	t
1411	Codigo Disponible	\N	\N	19	t
1412	Codigo Disponible	\N	\N	19	t
1413	Codigo Disponible	\N	\N	19	t
1414	Codigo Disponible	\N	\N	19	t
1415	Codigo Disponible	\N	\N	19	t
1416	Codigo Disponible	\N	\N	19	t
1417	Codigo Disponible	\N	\N	19	t
1418	Codigo Disponible	\N	\N	19	t
1419	Codigo Disponible	\N	\N	19	t
1420	Codigo Disponible	\N	\N	19	t
1421	Codigo Disponible	\N	\N	19	t
1422	Codigo Disponible	\N	\N	19	t
1423	Codigo Disponible	\N	\N	19	t
1424	Codigo Disponible	\N	\N	19	t
1425	Codigo Disponible	\N	\N	19	t
1426	Codigo Disponible	\N	\N	19	t
1427	Codigo Disponible	\N	\N	19	t
1428	Codigo Disponible	\N	\N	19	t
1429	Codigo Disponible	\N	\N	19	t
1430	Codigo Disponible	\N	\N	19	t
1431	Codigo Disponible	\N	\N	19	t
1432	Codigo Disponible	\N	\N	19	t
1433	Codigo Disponible	\N	\N	19	t
1434	Codigo Disponible	\N	\N	19	t
1435	Codigo Disponible	\N	\N	19	t
1436	Codigo Disponible	\N	\N	19	t
1437	Codigo Disponible	\N	\N	19	t
1438	Codigo Disponible	\N	\N	19	t
1439	Codigo Disponible	\N	\N	19	t
1440	Codigo Disponible	\N	\N	19	t
1441	Codigo Disponible	\N	\N	19	t
1442	Codigo Disponible	\N	\N	19	t
1443	Codigo Disponible	\N	\N	19	t
1444	Codigo Disponible	\N	\N	19	t
1445	Codigo Disponible	\N	\N	19	t
1446	Codigo Disponible	\N	\N	19	t
1447	Codigo Disponible	\N	\N	19	t
1448	Codigo Disponible	\N	\N	19	t
1449	Codigo Disponible	\N	\N	19	t
1450	Codigo Disponible	\N	\N	19	t
1451	Codigo Disponible	\N	\N	19	t
1452	Codigo Disponible	\N	\N	19	t
1453	Codigo Disponible	\N	\N	19	t
1454	Codigo Disponible	\N	\N	19	t
1455	Codigo Disponible	\N	\N	19	t
1456	Codigo Disponible	\N	\N	19	t
1457	Codigo Disponible	\N	\N	19	t
1458	Codigo Disponible	\N	\N	19	t
1459	Codigo Disponible	\N	\N	19	t
1460	Codigo Disponible	\N	\N	19	t
1461	Codigo Disponible	\N	\N	19	t
1462	Codigo Disponible	\N	\N	19	t
1463	Codigo Disponible	\N	\N	19	t
1464	Codigo Disponible	\N	\N	19	t
1465	Codigo Disponible	\N	\N	19	t
1466	Codigo Disponible	\N	\N	19	t
1467	Codigo Disponible	\N	\N	19	t
1468	Codigo Disponible	\N	\N	19	t
1469	Codigo Disponible	\N	\N	19	t
1470	Codigo Disponible	\N	\N	19	t
1471	Codigo Disponible	\N	\N	19	t
1472	Codigo Disponible	\N	\N	19	t
1473	Codigo Disponible	\N	\N	19	t
1474	Codigo Disponible	\N	\N	19	t
1475	Codigo Disponible	\N	\N	19	t
1476	Codigo Disponible	\N	\N	19	t
1477	Codigo Disponible	\N	\N	19	t
1478	Codigo Disponible	\N	\N	19	t
1479	Codigo Disponible	\N	\N	19	t
1480	Codigo Disponible	\N	\N	19	t
1481	Codigo Disponible	\N	\N	19	t
1482	Codigo Disponible	\N	\N	19	t
1483	Codigo Disponible	\N	\N	19	t
1484	Codigo Disponible	\N	\N	19	t
1485	Codigo Disponible	\N	\N	19	t
1486	Codigo Disponible	\N	\N	19	t
1487	Codigo Disponible	\N	\N	19	t
1488	Codigo Disponible	\N	\N	19	t
1489	Codigo Disponible	\N	\N	19	t
1490	Codigo Disponible	\N	\N	19	t
1491	Codigo Disponible	\N	\N	19	t
1492	Codigo Disponible	\N	\N	19	t
1493	Codigo Disponible	\N	\N	19	t
1494	Codigo Disponible	\N	\N	19	t
1495	Codigo Disponible	\N	\N	19	t
1496	Codigo Disponible	\N	\N	19	t
1497	Codigo Disponible	\N	\N	19	t
1498	Codigo Disponible	\N	\N	19	t
1499	Codigo Disponible	\N	\N	19	t
1500	Codigo Disponible	\N	\N	19	t
1501	Codigo Disponible	\N	\N	19	t
1502	Codigo Disponible	\N	\N	19	t
1503	Codigo Disponible	\N	\N	19	t
1504	Codigo Disponible	\N	\N	19	t
1505	Codigo Disponible	\N	\N	19	t
1506	Codigo Disponible	\N	\N	19	t
1507	Codigo Disponible	\N	\N	19	t
1508	Codigo Disponible	\N	\N	19	t
1509	Codigo Disponible	\N	\N	19	t
1510	Codigo Disponible	\N	\N	19	t
1511	Codigo Disponible	\N	\N	19	t
1512	Codigo Disponible	\N	\N	19	t
1513	Miscelanea Cristian	\N	\N	20	t
1514	Miscelanea Gaby	\N	\N	20	t
1515	Misc Brisa	\N	\N	20	t
1516	Miscelanea La Pasadita	\N	\N	20	t
1517	Miscelanea La Victoria	\N	\N	20	t
1518	Miscelanea Marivel	\N	\N	20	t
1519	Abarrotes Angel	\N	\N	20	t
1520	Miscelanea Doña Gila	\N	\N	20	t
1521	Miscelanea Rios	\N	\N	20	t
1522	Miscelanea La Victoria 2	\N	\N	20	t
1523	Misc Iker	\N	\N	20	t
1524	Super Jardines	\N	\N	20	t
1525	Miscelanea Lucia	\N	\N	20	t
1526	La Bola 2	\N	\N	20	t
1527	Miscelanea Carlitos	\N	\N	20	t
1528	Miscelanea Bodega de San Juditas	\N	\N	20	t
1529	Abarrotes Cristy	\N	\N	20	t
1530	RICARDO HUERTA DE LEON	\N	\N	20	t
1531	Miscelanea La Pequeña	\N	\N	20	t
1532	Miscelanea La Suiza	\N	\N	20	t
1533	Aidaly	\N	\N	20	t
1534	Miscelanea Tres Arbolitos	\N	\N	20	t
1535	Fruteria Cremeria Chonita	\N	\N	20	t
1536	Misc Lucy	\N	\N	20	t
1537	Don Pancho	\N	\N	20	t
1538	Las Glorias	\N	\N	20	t
1539	Misc Mary	\N	\N	20	t
1540	Misc Luna	\N	\N	20	t
1541	Mini Super La Morenita	\N	\N	20	t
1542	Valles	\N	\N	20	t
1543	La Bola	\N	\N	20	t
1544	Miscelanea Cecy	\N	\N	20	t
1545	Abarrotes Aragon	\N	\N	20	t
1546	Nachita	\N	\N	20	t
1547	4 Hermanos	\N	\N	20	t
1548	Miscelanea 7 Hermanos	\N	\N	20	t
1549	Miscelanea La Pasadita	\N	\N	20	t
1550	Miscelanea Anahi	\N	\N	20	t
1551	Miscelanea Las Lomas	\N	\N	20	t
1552	4 Hermanos	\N	\N	20	t
1553	Miscelanea Mi Tiendita	\N	\N	20	t
1554	Maria del Carmen Ruiz Arce	\N	\N	20	t
1555	Miscelanea Cuito	\N	\N	20	t
1556	Gorditas Kasandra	\N	\N	20	t
1557	Miscelanea Martha	\N	\N	20	t
1558	Miscelanea Lizeth	\N	\N	20	t
1559	La Bonita	\N	\N	20	t
1560	Miscelanea Mayra	\N	\N	20	t
1561	Miscelanea Gonzalez	\N	\N	20	t
1562	Miscelanea Raquel	\N	\N	20	t
1563	Restaurante Villa del Sol	\N	\N	20	t
1564	Linsef	\N	\N	20	t
1565	Miscelanea Gonzalez	\N	\N	20	t
1566	Miscelanea Aragon	\N	\N	20	t
1567	Abarrotes Aley	\N	\N	20	t
1568	Abarrotes Venegas	\N	\N	20	t
1569	Miscelanea La Esquinita	\N	\N	20	t
1570	Miscelanea Gaytan	\N	\N	20	t
1571	Super La Mariposa	\N	\N	20	t
1572	Abarrotes Adan	\N	\N	20	t
1573	Abarrotes Venegas 2	\N	\N	20	t
1574	Cristian y Gael	\N	\N	20	t
1575	Arnulfo	\N	\N	20	t
1576	Abarrotes La Ciudad	\N	\N	20	t
1577	Miscelanea Coscomate	\N	\N	20	t
1578	La Ventanita	\N	\N	20	t
1579	Carniceria Mis Princesas	\N	\N	20	t
1580	Miscelanea Alex	\N	\N	20	t
1581	Miscelanea Conasupo	\N	\N	20	t
1582	Miscelanea Melany	\N	\N	20	t
1583	Cremeria El Rancho	\N	\N	20	t
1584	Fatima	\N	\N	20	t
1585	Diconsa	\N	\N	20	t
1586	Miscelanea Las Galeras	\N	\N	20	t
1587	Miscelanea La Pasadita	\N	\N	20	t
1588	Miscelanea El Bosque	\N	\N	20	t
1589	Carniceria Angel	\N	\N	20	t
1590	Miscelanea Grammy	\N	\N	20	t
1591	Miscelanea Los Rafas	\N	\N	20	t
1592	Raymundo	\N	\N	20	t
1593	Miscelanea Paty	\N	\N	20	t
1594	Abarrotes Miranda	\N	\N	20	t
1595	Miscelanea Mary Paz	\N	\N	20	t
1596	Estanquillo Castro	\N	\N	20	t
1597	Miscelanea Martha	\N	\N	20	t
1598	Diconsa	\N	\N	20	t
1599	Las 3 N	\N	\N	20	t
1600	Miscelanea La Esperanza	\N	\N	20	t
1601	La Pasadita	\N	\N	20	t
1602	Miscelanea Sergio	\N	\N	20	t
1603	Miscelanea La Pasadita	\N	\N	20	t
1604	Misceanea Aranza	\N	\N	20	t
1605	Miscelanea Vero	\N	\N	20	t
1606	Tienda Ejidal	\N	\N	20	t
1607	Miscelanea La Guadalupana	\N	\N	20	t
1608	Loncheria Pamela	\N	\N	20	t
1609	Miscelanea La Pasadita	\N	\N	20	t
1610	Miscelanea Adry	\N	\N	20	t
1611	Miscelanea Flor de Regocijo	\N	\N	20	t
1612	Conasupo	\N	\N	20	t
1613	El Cedrito	\N	\N	20	t
1614	Restaurante Kari	\N	\N	20	t
1615	Misc R.V	\N	\N	20	t
1616	Miscelanea Velazquez	\N	\N	20	t
1617	Misc Pedro y Pablo	\N	\N	20	t
1618	Mis Gorditas	\N	\N	20	t
1619	Miscelanea Blanca	\N	\N	20	t
1620	Diconsa	\N	\N	20	t
1621	Super Los Arbolitos	\N	\N	20	t
1622	Miscelanea La Escuelita	\N	\N	20	t
1623	Expendio Norte	\N	\N	20	t
1624	Miscelanea Luz Elena	\N	\N	20	t
1625	Carniceria Cheche	\N	\N	20	t
1626	Miscelanea La Mexicana	\N	\N	20	t
1627	Miscelanea Mini Abarrotes	\N	\N	20	t
1628	Miscelanea El Pueblito	\N	\N	20	t
1629	Miscelanea El Pueblo	\N	\N	20	t
1630	Miscelanea La Escondida	\N	\N	20	t
1631	Miscelanea Maribel	\N	\N	20	t
1632	Miscelanea La China	\N	\N	20	t
1633	Miscelanea Pitey	\N	\N	20	t
1634	Miscelanea Dany	\N	\N	20	t
1635	Miscelanea Michel	\N	\N	20	t
1636	Miscelanea Olvera	\N	\N	20	t
1637	MARIA DEL RAYO SALMERON GUERRA	\N	\N	20	t
1638	LEONARDO GARCIA RENTERIA	\N	\N	20	t
1639	Miscelanea Los Venados	\N	\N	20	t
1640	Miscelanea Diconsa Manzanal	\N	\N	20	t
1641	Miscelanea Martin	\N	\N	20	t
1642	Miscelanea Llano Grande	\N	\N	20	t
1643	Miscelanea Karen	\N	\N	20	t
1644	Miscelanea Rosalva	\N	\N	20	t
1645	ABARROTES VENEGAS	\N	\N	20	t
1646	ABARROTES VENEGAS	\N	\N	20	t
1647	Venegas Vías	\N	\N	20	t
1648	ABARROTES VENEGAS	\N	\N	20	t
1649	ABARROTES VENEGAS	\N	\N	20	t
1650	Diconsa	\N	\N	21	t
1651	Miscelanea Vazquez	\N	\N	21	t
1652	Miscelanea Los Corrales	\N	\N	21	t
1653	Carniceria Hernandez	\N	\N	21	t
1654	Miscelanea OTY	\N	\N	21	t
1655	Super Cacho	\N	\N	21	t
1656	Miscelanea Ofelia	\N	\N	21	t
1657	Misc Antuan	\N	\N	21	t
1658	Miscelanea Minerva	\N	\N	21	t
1659	Miscelanea Roye	\N	\N	21	t
1660	Veronica Esparza Lopez	\N	\N	21	t
1661	Misc Don Pepe	\N	\N	21	t
1662	Miscelanea Luna	\N	\N	21	t
1663	Miscelanea Angelita	\N	\N	21	t
1664	ALMA LETICIA VALVERDE GONZALEZ	\N	\N	21	t
1665	Mini Super El Nacho	\N	\N	21	t
1666	Misc Yunior	\N	\N	21	t
1667	Super Cacho	\N	\N	21	t
1668	Miscelanea Luna	\N	\N	21	t
1669	Gorditas La Sofía	\N	\N	21	t
1670	Misc Valeria	\N	\N	21	t
1671	La Morena	\N	\N	21	t
1672	Gorditas La Sofía	\N	\N	21	t
1673	Maria Hortencia Hernandez Cisneros	\N	\N	21	t
1674	Misc Diconsa	\N	\N	21	t
1675	Mi Tiendita	\N	\N	21	t
1676	Gorditas Las Gabrielas	\N	\N	21	t
1677	Gorditas Karen V	\N	\N	21	t
1678	Fruteria y Abarrotes Valtor	\N	\N	21	t
1679	Mi Cabaña	\N	\N	21	t
1680	Misc Yorley	\N	\N	21	t
1681	La Pasadita	\N	\N	21	t
1682	Miscelanea Isabel	\N	\N	21	t
1683	Mini súper diez	\N	\N	21	t
1684	MARIO ERNESTO YAÑEZ AMAYA	\N	\N	21	t
1685	Super Dos Torres	\N	\N	21	t
1686	Ab Lupita	\N	\N	21	t
1687	Abarrotes Aaron	\N	\N	21	t
1688	Misc Casa Blanca	\N	\N	21	t
1689	Misc La Unica	\N	\N	21	t
1690	Misc Morales	\N	\N	21	t
1691	Fruteria	\N	\N	21	t
1692	Misc Fresnos	\N	\N	21	t
1693	Misc Aurelia	\N	\N	21	t
1694	Lesly	\N	\N	21	t
1695	Mini Super Estrella	\N	\N	21	t
1696	Miscelanea Mitza	\N	\N	21	t
1697	Miscelanea La Esperanza	\N	\N	21	t
1698	Misc San Juaditas	\N	\N	21	t
1699	La Deportiva	\N	\N	21	t
1700	Miscelánea Guadalupana	\N	\N	21	t
1701	Misc Angeles	\N	\N	21	t
1702	La Unica	\N	\N	21	t
1703	Miscelánea Elizabeth	\N	\N	21	t
1704	Miscelanea La Reyna	\N	\N	21	t
1705	Miscelanea Mi Tiendita	\N	\N	21	t
1706	Miscelánea Lupita	\N	\N	21	t
1707	Miscelánea Mi Ranchito	\N	\N	21	t
1708	El Baraton	\N	\N	21	t
1709	Miscelanea La Hacienda	\N	\N	21	t
1710	La Trinidad	\N	\N	21	t
1711	La Preferida	\N	\N	21	t
1712	Conservas Goyita	\N	\N	21	t
1713	Misc Alondra	\N	\N	21	t
1714	Miscelanea Olga	\N	\N	21	t
1715	Miscelanea Betty	\N	\N	21	t
1716	Misc Paty	\N	\N	21	t
1717	Miscelanea Mary	\N	\N	21	t
1718	Miscelanea Karen	\N	\N	21	t
1719	Miscelanea Doña Chepa	\N	\N	21	t
1720	Miscelanea Daniela	\N	\N	21	t
1721	Miscelanea Kebin	\N	\N	21	t
1722	La Pasadita	\N	\N	21	t
1723	Ojo de Agua San Juan	\N	\N	21	t
1724	Kenya	\N	\N	21	t
1725	Miscelánea Mayra	\N	\N	21	t
1726	Miscelanea Gana	\N	\N	21	t
1727	Verde	\N	\N	21	t
1728	El Puestito	\N	\N	21	t
1729	Misc Mas que Barato	\N	\N	21	t
1730	Misc Galindo	\N	\N	21	t
1731	Liconsa	\N	\N	21	t
1732	Ab Oly	\N	\N	21	t
1733	Ponce	\N	\N	21	t
1734	Divina Providencia	\N	\N	21	t
1735	Miscelanea Morada	\N	\N	21	t
1736	Tortilleria Campesina	\N	\N	21	t
1737	Misc Mona	\N	\N	21	t
1738	Miscelánea Blanca	\N	\N	21	t
1739	Mi Tiendita	\N	\N	21	t
1740	Magui	\N	\N	21	t
1741	Puesto Gorditas	\N	\N	21	t
1742	Misc La Entrada	\N	\N	21	t
1743	Abarrotes Galvan	\N	\N	21	t
1744	Pamilu	\N	\N	21	t
1745	Rubi	\N	\N	21	t
1746	Misc Gera	\N	\N	21	t
1747	Tienda Verde Con Blanco	\N	\N	21	t
1748	La Ventanita	\N	\N	21	t
1749	Minisuper La Trinidad	\N	\N	21	t
1750	Miscelánea Erika	\N	\N	21	t
1751	Misc 2 Cristys	\N	\N	21	t
1752	Codigo Disponible	\N	\N	21	t
1753	Miscelanea Isabel	\N	\N	21	t
1754	Misc Lupita	\N	\N	21	t
1755	Miscelanea La Ventanita	\N	\N	21	t
1756	Misc Antuan	\N	\N	21	t
1757	Miscelanea El Amigo	\N	\N	21	t
1758	Miscelanea Ramirez	\N	\N	21	t
1759	Miscelanea Linda	\N	\N	21	t
1760	Abarrotes la Canasta	\N	\N	21	t
1761	Misc Raquel	\N	\N	21	t
1762	El Abuelo	\N	\N	21	t
1763	Misc Kenia	\N	\N	21	t
1764	Verde	\N	\N	21	t
1765	Miscelanea Junior	\N	\N	21	t
1766	Miscelánea Rosy Store	\N	\N	21	t
1767	Rejas negras	\N	\N	21	t
1768	Miscelánea Arlette	\N	\N	21	t
1769	Esquina Café Dos Pisos	\N	\N	21	t
1770	Miscelánea La Pasadita	\N	\N	21	t
1771	Cremita Con Corredor	\N	\N	21	t
1772	Sin Pintar Puertas Metal	\N	\N	21	t
1773	Esquina Verde	\N	\N	21	t
1774	Carniceria y Super Las Palmas	\N	\N	21	t
1775	Losc 6 Nietos	\N	\N	21	t
1776	Misc. Dany	\N	\N	21	t
1777	Tiendita Las Galeras	\N	\N	21	t
1778	Misc. La Caseta	\N	\N	21	t
1779	Ab. Felix	\N	\N	21	t
1780	Misc. Marys	\N	\N	21	t
1781	Puesto La Pasadita	\N	\N	21	t
1782	Puesto Pao	\N	\N	21	t
1783	Misc. San Judas	\N	\N	21	t
1784	Misc. La Esquina	\N	\N	21	t
1785	Misc. La Ventana	\N	\N	21	t
1786	Misc. Manuel	\N	\N	21	t
1787	Magui	\N	\N	21	t
1788	Misc Esperanza	\N	\N	21	t
1789	Los 3 Gabrielas	\N	\N	21	t
1790	La Ventanita	\N	\N	21	t
1791	La Pasadita	\N	\N	21	t
1792	Diconsa	\N	\N	21	t
1793	Misc Debyki	\N	\N	22	t
1794	Misc Gina	\N	\N	22	t
1795	LEONEL GUILLERMO AYALA AVILA	\N	\N	22	t
1796	LA BODEGA DE LOS AYALA	\N	\N	22	t
1797	Miscelánea Nuñez	\N	\N	22	t
1798	ARTURO AYALA AVILA	\N	\N	22	t
1799	Diconsa	\N	\N	22	t
1800	NORMA DELIA OROZCO SALAS	\N	\N	22	t
1801	JOSE RICARDO AYALA AVILA	\N	\N	22	t
1802	JOSE RICARDO AYALA AVILA	\N	\N	22	t
1803	Abarrotes Ortega	\N	\N	22	t
1804	Miscelánea Astrid	\N	\N	22	t
1805	Verde Porton Blanco	\N	\N	22	t
1806	Abarrotes Junior	\N	\N	22	t
1807	Miscelanea Martha	\N	\N	22	t
1808	SUPER EL MARINERO SA DE CV	\N	\N	22	t
1809	ALVARO FLORES SANCHEZ	\N	\N	22	t
1810	Abarrotes Juanita	\N	\N	22	t
1811	Gorditas Salas	\N	\N	22	t
1812	Carniceeria Nava	\N	\N	22	t
1813	Abarrotes Lorenita	\N	\N	22	t
1814	Miscelanea Marcela	\N	\N	22	t
1815	Miscelánea Yanira	\N	\N	22	t
1816	Eva Arrellano Zamora	\N	\N	22	t
1817	Rene Cortez	\N	\N	22	t
1818	Miscelánea Blanquita	\N	\N	22	t
1819	Super Anfermart	\N	\N	22	t
1820	Ab Ortega	\N	\N	22	t
1821	Ab Jesi	\N	\N	22	t
1822	Ab. Adelita	\N	\N	22	t
1823	Diconsa	\N	\N	22	t
1824	Gorditas Celia	\N	\N	22	t
1825	Miscelánea San Pedro	\N	\N	22	t
1826	Miscelánea Moreno	\N	\N	22	t
1827	Carnicería Rancho Grande	\N	\N	22	t
1828	Miscelánea Monica	\N	\N	22	t
1829	Gorditas Reyes	\N	\N	22	t
1830	Miscelánea Don Toño	\N	\N	22	t
1831	Carnicería La Fuente	\N	\N	22	t
1832	Miscelánea Falcon	\N	\N	22	t
1833	Color Verde	\N	\N	22	t
1834	Color Rojo	\N	\N	22	t
1835	Super Calilos	\N	\N	22	t
1836	Miscelánea La Negrita	\N	\N	22	t
1837	Super 10	\N	\N	22	t
1838	Miscelánea El Cafe	\N	\N	22	t
1839	Misceláneos Benny	\N	\N	22	t
1840	Sayda Isel Simental Avila	\N	\N	22	t
1841	Susana Meza	\N	\N	22	t
1842	Bodega El Oaxaqueño	\N	\N	22	t
1843	Miscelánea Luz Azul	\N	\N	22	t
1844	Mic. Mony	\N	\N	22	t
1845	Antonio	\N	\N	22	t
1846	Rosa Salas	\N	\N	22	t
1847	Super La Lomita	\N	\N	22	t
1848	Abarrotes San Juditas	\N	\N	22	t
1849	ISMAEL ARTURO TORRES JIMENEZ	\N	\N	22	t
1850	Miscelánea Flores	\N	\N	22	t
1851	Misc Estrellita Azul	\N	\N	22	t
1852	Mi Ranchito Chiquito	\N	\N	22	t
1853	Carnicería y Abarrotes Mayey	\N	\N	22	t
1854	DIANA PATRICIA PUENTE PINEDA	\N	\N	22	t
1855	Miscelánea La Estrella	\N	\N	22	t
1856	Súper Carta	\N	\N	22	t
1857	Abarrotes Paola	\N	\N	22	t
1858	Misc Gema	\N	\N	22	t
1859	Misc América	\N	\N	22	t
1860	Super Mary	\N	\N	22	t
1861	Gorditas Tolita	\N	\N	22	t
1862	Misc Morada	\N	\N	22	t
1863	La Tiendita	\N	\N	22	t
1864	Entronque	\N	\N	22	t
1865	Gorditas Tere	\N	\N	22	t
1866	Sin Pintar Barcel	\N	\N	22	t
1867	Abarrotes Pacheco	\N	\N	22	t
1868	JOSE ENRIQUE GONZALEZ NERI	\N	\N	22	t
1869	Misc Karla	\N	\N	22	t
1870	Carniceria Hnos Mata	\N	\N	22	t
1871	Miscelánea Verde Naranja	\N	\N	22	t
1872	Miscelánea Daniel	\N	\N	22	t
1873	Miscelánea Andrea	\N	\N	22	t
1874	Mini Super Corona	\N	\N	22	t
1875	Gorditas Antojitos Mexicanos	\N	\N	22	t
1876	Tienda de Abarrotes	\N	\N	22	t
1877	MARIA TERESA CORRES MIJARES	\N	\N	22	t
1878	Maria Isabel Alvarado	\N	\N	22	t
1879	Miscelánea Laurita	\N	\N	22	t
1880	Abarrotes  Alma	\N	\N	22	t
1881	La Pasadita	\N	\N	22	t
1882	Abarrotes Alonso	\N	\N	22	t
1883	Mini Super La Guadalupana	\N	\N	22	t
1884	Misc Cacho	\N	\N	22	t
1885	Miscelanea El Naranjo	\N	\N	22	t
1886	Miscelánea Salas	\N	\N	22	t
1887	Papeleria Y Abarrotes D Vicky	\N	\N	22	t
1888	Esquina Amarilla	\N	\N	22	t
1889	Esquina Verde Cristal	\N	\N	22	t
1890	Tienda de Piedra	\N	\N	22	t
1891	Mini Super Del Centro	\N	\N	22	t
1892	Micelanea Ibarra	\N	\N	22	t
1893	Miscelanea Rivas	\N	\N	22	t
1894	Miscelánea La Morena	\N	\N	22	t
1895	Abarrotes El Cocono	\N	\N	22	t
1896	Las Gorditas Reza	\N	\N	22	t
1897	La cocina de Tita	\N	\N	22	t
1898	Esquina Rosa con Gris	\N	\N	22	t
1899	Miscelanea Susy	\N	\N	22	t
1900	Miscelaena Santa Lucia	\N	\N	22	t
1901	Miscelánea Rocio	\N	\N	22	t
1902	Miscelánea Maricela	\N	\N	22	t
1903	Miscelánea Junior	\N	\N	22	t
1904	Miscelánea Soco	\N	\N	22	t
1905	Frente a la Plazuela	\N	\N	22	t
1906	Miscelanea Sion	\N	\N	22	t
1907	Miscelánea Betty	\N	\N	22	t
1908	Miscelanea Norma	\N	\N	22	t
1909	Miscelánea El Triunfo	\N	\N	22	t
1910	Miscelánea Luz	\N	\N	22	t
1911	Miscelanea El Resbalon	\N	\N	22	t
1912	Gorditas Mary	\N	\N	22	t
1913	Gorditas	\N	\N	22	t
1914	Miscelanea Sin Nombre	\N	\N	22	t
1915	Miscelanea Mini	\N	\N	22	t
1916	Miscelánea Malena	\N	\N	22	t
1917	Miscelánea Julia	\N	\N	22	t
1918	Miscelánea Maria de Jesus	\N	\N	22	t
1919	Miscelánea Nena	\N	\N	22	t
1920	Mi Tiendita  Marce	\N	\N	22	t
1921	Azul con Cristal	\N	\N	22	t
1922	Fruteria Y Super Chachis	\N	\N	22	t
1923	Fruteria Frucentro	\N	\N	22	t
1924	Misc Viky	\N	\N	22	t
1925	Gordas Mony	\N	\N	22	t
1926	Super J Ibarra	\N	\N	22	t
1927	Menuderia Martinez	\N	\N	22	t
1928	Granos Y Semillas El Piñonaso	\N	\N	22	t
1929	Carniceria Calilos	\N	\N	22	t
1930	Super Segui	\N	\N	22	t
1931	casa blanca	\N	\N	22	t
1932	gris	\N	\N	22	t
1933	ab y miscelánea	\N	\N	22	t
1934	Valeria sarai sanchez	\N	\N	22	t
1935	Hamburguesas Marifer	\N	\N	22	t
1936	mi tiendita	\N	\N	22	t
1937	abarrotes Michel	\N	\N	22	t
1938	papeleria y minisuper Rosas	\N	\N	22	t
1939	miscelánea el parque	\N	\N	22	t
1940	Brenda Avitia Martinez	\N	\N	22	t
1941	Misc La Pasadita	\N	\N	23	t
1942	Misc Cecy	\N	\N	23	t
1943	Gorditas Mary	\N	\N	23	t
1944	Gorditas Chepa	\N	\N	23	t
1945	Fruteria El Primo	\N	\N	23	t
1946	Forrajes y Ab Emmanuel	\N	\N	23	t
1947	AURELIO GONZALEZ NERI	\N	\N	23	t
1948	JESUS ALBERTO GONZALEZ RAMIREZ	\N	\N	23	t
1949	Misc Don Gato 2	\N	\N	23	t
1950	ALBERTO GONZALEZ NERI	\N	\N	23	t
1951	Frutas y Abarrotes Rios	\N	\N	23	t
1952	Gorditas  Mercado 2	\N	\N	23	t
1953	Abarrotes Luis	\N	\N	23	t
1954	Misc. Nachita	\N	\N	23	t
1955	Miscelanea Bely	\N	\N	23	t
1956	Frutilandia	\N	\N	23	t
1957	Don Gato	\N	\N	23	t
1958	Abarrotes David	\N	\N	23	t
1959	Misc Vini	\N	\N	23	t
1960	Miscelanea Maritza	\N	\N	23	t
1961	Miscelanea SHADAY	\N	\N	23	t
1962	El Paso	\N	\N	23	t
1963	Misc Kamila	\N	\N	23	t
1964	Miscelanea Abarrotes Paula	\N	\N	23	t
1965	Misc Mi Tiendita	\N	\N	23	t
1966	Diconsa	\N	\N	23	t
1967	Miscelanea Marina	\N	\N	23	t
1968	Miscelanea El Tenchis	\N	\N	23	t
1969	La Tienda de Ale	\N	\N	23	t
1970	El Reten	\N	\N	23	t
1971	La Bendicion	\N	\N	23	t
1972	Esquinita de Oro	\N	\N	23	t
1973	Miselanea Marissa	\N	\N	23	t
1974	Misc El Zaguan	\N	\N	23	t
1975	Miscelanea La Paloma	\N	\N	23	t
1976	Misc Chatita	\N	\N	23	t
1977	La Maqueta del Centro	\N	\N	23	t
1978	Miscelanea Monica	\N	\N	23	t
1979	Servicios GARAY	\N	\N	23	t
1980	Gris Puerta Azul	\N	\N	23	t
1981	Mini Tienda El Refugio de Vane	\N	\N	23	t
1982	Carniceria Ramirez Pulgarin	\N	\N	23	t
1983	Miscelanea Teresita	\N	\N	23	t
1984	Abarrotes Eli	\N	\N	23	t
1985	Mi Tiendita	\N	\N	23	t
1986	Pansa Lllena Corazon Contento	\N	\N	23	t
1987	Desayunos Mary	\N	\N	23	t
1988	Tienda El Paraiso	\N	\N	23	t
1989	Tienda Amarillo sin anuncios	\N	\N	23	t
1990	Misc Paraiso	\N	\N	23	t
1991	Misc Margarita	\N	\N	23	t
1992	La Morita	\N	\N	23	t
1993	Los Tres Reyes	\N	\N	23	t
1994	Tienda Ventana	\N	\N	23	t
1995	Miscelanea Salvador	\N	\N	23	t
1996	Gorditas Betty	\N	\N	23	t
1997	Misc La Lupita	\N	\N	23	t
1998	Mini Super Lopez	\N	\N	23	t
1999	Tienda San Juditas	\N	\N	23	t
2000	Miscelanea El Solitario	\N	\N	23	t
2001	Gorditas Verde Convinado	\N	\N	23	t
2002	Misc Y Panaderia Linda	\N	\N	23	t
2003	Amarillo con cimientos de piedra	\N	\N	23	t
2004	Abarrotes la unidad	\N	\N	23	t
2005	Misc Elvira	\N	\N	23	t
2006	Miscelanea Villarreal	\N	\N	23	t
2007	Misc Los Criss	\N	\N	23	t
2008	Maricela	\N	\N	23	t
2009	La Pasadita	\N	\N	23	t
2010	Misc Noony	\N	\N	23	t
2011	Miscelanea Alondra	\N	\N	23	t
2012	Misc Mary	\N	\N	23	t
2013	Misc Diana	\N	\N	23	t
2014	Miscelanea Blanquita	\N	\N	23	t
2015	Miscelanea de Manuel Arroyo	\N	\N	23	t
2016	Miscelanea Yoli	\N	\N	23	t
2017	Gorditas Ma del Rocio	\N	\N	23	t
2018	Blanco Con Marco Rojo	\N	\N	23	t
2019	Miscelanea en esquina	\N	\N	23	t
2020	Misc Marce	\N	\N	23	t
2021	Abarrotes Kito	\N	\N	23	t
2022	Abarrotes Jenny	\N	\N	23	t
2023	Misc Karla	\N	\N	23	t
2024	Miscelanea Castañeda	\N	\N	23	t
2025	Abarrotes Lourdes	\N	\N	23	t
2026	Mi Tiendita	\N	\N	23	t
2027	Papeleria y Miscelanea El Sol	\N	\N	23	t
2028	Gorditas maiz y harina	\N	\N	23	t
2029	Pizzas Flores	\N	\N	23	t
2030	Misc Regina	\N	\N	23	t
2031	Miscelanea Lupita	\N	\N	23	t
2032	Misc Mariana	\N	\N	23	t
2033	Gorditas Mena	\N	\N	23	t
2034	Miscelanea El Tepeyac	\N	\N	23	t
2035	Miscelánea Lucero	\N	\N	23	t
2036	Miscelánea Elarcoiris	\N	\N	23	t
2037	Abarrotes Ortega	\N	\N	23	t
2038	Misc La Colonia	\N	\N	23	t
2039	Frutas y Abarrotes Pilly	\N	\N	23	t
2040	Miscelánea Damaris	\N	\N	23	t
2041	Miscelánea Guney	\N	\N	23	t
2042	Super Florian	\N	\N	23	t
2043	Misc Pepés	\N	\N	23	t
2044	Misc Kalet	\N	\N	23	t
2045	Misc El Arbolito	\N	\N	23	t
2046	Abarrotes Magaly	\N	\N	23	t
2047	Taquitos Rossy	\N	\N	23	t
2048	Miscelánea Mimy	\N	\N	23	t
2049	Miscelánea El Sabino	\N	\N	23	t
2050	Gorditas Susy	\N	\N	23	t
2051	Mariscos el Malekon	\N	\N	23	t
2052	Gorditas Mercado	\N	\N	23	t
2053	Abarrotes al lado de la Iglesia	\N	\N	23	t
2054	Super del Centro	\N	\N	23	t
2055	Gorditas el Arco	\N	\N	23	t
2056	Tienda Blanca con Lamina	\N	\N	23	t
2057	Tienda de Abarrotes Lupita	\N	\N	23	t
2058	Enseguida Del Templo	\N	\N	23	t
2059	Misc Lizbeth	\N	\N	23	t
2060	Miscelánea Del Rio	\N	\N	23	t
2061	Color Amarillo	\N	\N	23	t
2062	Misc Oly	\N	\N	23	t
2063	Verde Con Azulejo	\N	\N	23	t
2064	Esquina Con Tejas	\N	\N	23	t
2065	Azul Marino Anuncio Lala	\N	\N	23	t
2066	Mnisc Abraham	\N	\N	23	t
2067	Tienda Azul con Lamina	\N	\N	23	t
2068	Comedor Mary	\N	\N	23	t
2069	Abarrotes Arce	\N	\N	23	t
2070	Panaderia y  Miscelanea Lara	\N	\N	23	t
2071	Misc. Kary	\N	\N	23	t
2072	Fruteria Carmona	\N	\N	23	t
2073	Misc Miguel	\N	\N	23	t
2074	RICARDO AYALA RODRIGUEZ	\N	\N	23	t
2075	Frutería y Abarrotes RG	\N	\N	24	t
2076	Misc Alicia	\N	\N	24	t
2077	Gorditas Elena	\N	\N	24	t
2078	Misc Alondra	\N	\N	24	t
2079	Mini Super El Paraiso	\N	\N	24	t
2080	Tortas Montana	\N	\N	24	t
2081	Las Tardes de Abril	\N	\N	24	t
2082	Restaurante El Portal	\N	\N	24	t
2083	Miscelanea Calzada	\N	\N	24	t
2084	Mini Super	\N	\N	24	t
2085	Juli Ana	\N	\N	24	t
2086	Mini Super La Economica	\N	\N	24	t
2087	Miscelanea El Pedregal	\N	\N	24	t
2088	Miscelanea La Pelusa	\N	\N	24	t
2089	Miscelanea El Enano	\N	\N	24	t
2090	Miscelanea El Capiro	\N	\N	24	t
2091	Miscelanea Kristal	\N	\N	24	t
2092	El Duvalin	\N	\N	24	t
2093	Miscelanea Aguilar	\N	\N	24	t
2094	Abarrotes Laurita Temporada	\N	\N	24	t
2095	Miscelanea La Chiquita	\N	\N	24	t
2096	La Campanita	\N	\N	24	t
2097	Saul Villareal	\N	\N	24	t
2098	Miscelanea Liset	\N	\N	24	t
2099	Tienda Diconsa	\N	\N	24	t
2100	Miscelanea Chentita	\N	\N	24	t
2101	Juan Carlos Ramirez	\N	\N	24	t
2102	Miscelanea La Pasadita	\N	\N	24	t
2103	Flores	\N	\N	24	t
2104	Super Jimenez	\N	\N	24	t
2105	Miscelanea Maurilio	\N	\N	24	t
2106	Miscelanea La Vencedora	\N	\N	24	t
2107	Abarrotes Madero	\N	\N	24	t
2108	Abarrotes Escaleras	\N	\N	24	t
2109	Miscelanea Kristal	\N	\N	24	t
2110	Luis Soto	\N	\N	24	t
2111	Miscelanea Mi Reyna	\N	\N	24	t
2112	Francisca Soto	\N	\N	24	t
2113	Okiroki	\N	\N	24	t
2114	Fruteria Ramirez	\N	\N	24	t
2115	Mini Super Jesus	\N	\N	24	t
2116	Ab Plaza	\N	\N	24	t
2117	Misc Liseth	\N	\N	24	t
2118	Misc Patoni	\N	\N	24	t
2119	Misc La Unica	\N	\N	24	t
2120	Misc Karen	\N	\N	24	t
2121	Ab Arsola	\N	\N	24	t
2122	Cristobal	\N	\N	24	t
2123	Tienda Jesus	\N	\N	24	t
2124	Tecate	\N	\N	24	t
2125	Oasis	\N	\N	24	t
2126	Restaurant Oasis	\N	\N	24	t
2127	Super Lopez	\N	\N	24	t
2128	Tienda del Pino	\N	\N	24	t
2129	Gorditas	\N	\N	24	t
2130	Misc Lupita	\N	\N	24	t
2131	Abarrotes Valdez	\N	\N	24	t
2132	Mini Super Nelly	\N	\N	24	t
2133	Miscelánea Quiroz	\N	\N	24	t
2134	Aylin	\N	\N	24	t
2135	Diconsa	\N	\N	24	t
2136	Abarrotes Maldonado	\N	\N	24	t
2137	Misc Adame	\N	\N	24	t
2138	Super Verde	\N	\N	24	t
2139	Tienda Anahi	\N	\N	24	t
2140	Miscelánea Jenny	\N	\N	24	t
2141	Miscelánea Chelo	\N	\N	24	t
2142	Super Fer	\N	\N	24	t
2143	Miscelánea Verde2. Pisos	\N	\N	24	t
2144	Miscelánea Blanco con Azul	\N	\N	24	t
2145	Abarrotes Valenzuela	\N	\N	24	t
2146	Mi. Super	\N	\N	24	t
2147	TOMAS CHAVEZ FLORES	\N	\N	24	t
2148	Arturo Flores	\N	\N	24	t
2149	Miscelánea Las Olas Altas	\N	\N	24	t
2150	Miscelánea Lizbeth	\N	\N	24	t
2151	Miscelánea Con Lamina	\N	\N	24	t
2152	El Sazón de Doña Kika	\N	\N	24	t
2153	BRENDA BERENICE ARGUIJO HUERTA	\N	\N	24	t
2154	Miscelánea Amarillo con Naranja	\N	\N	24	t
2155	Miscelánea Verde Combinado	\N	\N	24	t
2156	Miscelánea Banco con Lamina	\N	\N	24	t
2157	Misc Tania	\N	\N	24	t
2158	Miscelánea Crema con Teja	\N	\N	24	t
2159	Miscelánea de Piedra	\N	\N	24	t
2160	Miscelánea Las Gemelas	\N	\N	24	t
2161	Misc Vale	\N	\N	24	t
2162	Miscelánea Corona con Lamina	\N	\N	24	t
2163	Miscelánea Rojo con Blanco	\N	\N	24	t
2164	Misc Yareli	\N	\N	24	t
2165	Miscelánea Verde con Blanco	\N	\N	24	t
2166	Misc LALA	\N	\N	24	t
2167	Miscelánea Amarillo con Lamina	\N	\N	24	t
2168	Miscelánea Verde	\N	\N	24	t
2169	Miscelánea Violeta	\N	\N	24	t
2170	Miscelánea Azul	\N	\N	24	t
2171	Miscelánea Verde gris	\N	\N	24	t
2172	Miscelánea Blanco con Azul	\N	\N	24	t
2173	Miscelánea Naranja	\N	\N	24	t
2174	Miscelánea Verde Combinada	\N	\N	24	t
2175	Julia Garcia Puebla	\N	\N	24	t
2176	Miscelánea Puerta Blanca	\N	\N	24	t
2177	Diconsa Cienega	\N	\N	24	t
2178	Mairany	\N	\N	24	t
2179	Miscelánea de Adobe	\N	\N	24	t
2180	Misc Lucy	\N	\N	24	t
2181	Olga	\N	\N	24	t
2182	La Pasadita	\N	\N	24	t
2183	MiniSuper Michel	\N	\N	24	t
2184	Miscelánea Portón Blanco	\N	\N	24	t
2185	Miscelánea Amarillo	\N	\N	24	t
2186	Miscelánea Holguin	\N	\N	24	t
2187	Miscelánea Lila	\N	\N	24	t
2188	Miscelánea Verde	\N	\N	24	t
2189	Tienda Gualo	\N	\N	24	t
2190	Misc Josefina	\N	\N	24	t
2191	Miscelánea Solis	\N	\N	24	t
2192	Abarrotes Santana	\N	\N	24	t
2193	Miscelánea Celia	\N	\N	24	t
2194	Ab Cristry	\N	\N	24	t
2195	Abarrotes Doña Lina	\N	\N	24	t
2196	Ab Alex	\N	\N	24	t
2197	MiniSuper Lago de los Patos	\N	\N	24	t
2198	Frutería Romar	\N	\N	24	t
2199	Frutería y Abarrotes La Bodeguita	\N	\N	24	t
2200	Miscelánea Maltos	\N	\N	24	t
2201	Carniceria La Rancherita	\N	\N	24	t
2202	Miscelánea Portón Blanco	\N	\N	24	t
2203	Abarrotes Laurita SF	\N	\N	24	t
2204	Miscelanea Guadalupe	\N	\N	24	t
2205	Misc Lupita	\N	\N	24	t
2206	Abarrotes Madero	\N	\N	24	t
2207	El Corruño	\N	\N	24	t
2208	Super Daisy	\N	\N	24	t
2209	La Tiendita	\N	\N	24	t
2210	Panaderia Mingo	\N	\N	24	t
2211	Abarrotes Romero	\N	\N	24	t
2212	Tortilleria Don Poncho	\N	\N	24	t
2213	Misc. Mague	\N	\N	24	t
2214	Misc. Don M	\N	\N	24	t
2215	Misc. Nelly	\N	\N	24	t
2216	Super El Padre	\N	\N	24	t
2217	Misc. Zapateria	\N	\N	24	t
2218	Cocina Economica	\N	\N	24	t
2219	Misc Lucy	\N	\N	24	t
2220	La Ventanita	\N	\N	24	t
2221	Misc La Laguna	\N	\N	24	t
2222	Emiliana	\N	\N	24	t
2223	Carniceria Del Centro	\N	\N	24	t
2224	Super Zito	\N	\N	24	t
2225	Codigo Disponible 4	\N	\N	25	t
2226	SILVIA FAVELA GUERRERO	\N	\N	25	t
2227	Misc Rodriguez	\N	\N	25	t
2228	Misc Chapito	\N	\N	25	t
2229	Casa Rosa	\N	\N	25	t
2230	Misc Bajio	\N	\N	25	t
2231	Super Ramirez	\N	\N	25	t
2232	Mnisc Angy	\N	\N	25	t
2233	Misc Genesis	\N	\N	25	t
2234	Misc Mi tiendita	\N	\N	25	t
2235	Cariceria Cardoza	\N	\N	25	t
2236	Misc Esmeralda	\N	\N	25	t
2237	Misc Brease	\N	\N	25	t
2238	Misc Quiñones	\N	\N	25	t
2239	Carnieceria Jimenez	\N	\N	25	t
2240	Misc Trujillo	\N	\N	25	t
2241	Silvia Terrones	\N	\N	25	t
2242	Misc Brintanny	\N	\N	25	t
2243	Super 2000	\N	\N	25	t
2244	Misc La Paz	\N	\N	25	t
2245	Misc Lupita	\N	\N	25	t
2246	Misc Mayra	\N	\N	25	t
2247	Misc Lúlu	\N	\N	25	t
2248	Misc Nancy	\N	\N	25	t
2249	Misc La China	\N	\N	25	t
2250	Misac Tadeo	\N	\N	25	t
2251	Super La Curva	\N	\N	25	t
2252	Restaurant La Curva	\N	\N	25	t
2253	Restaurant y Hotel	\N	\N	25	t
2254	Diconsa Altares	\N	\N	25	t
2255	Girasoles	\N	\N	25	t
2256	La Escondida	\N	\N	25	t
2257	La Ventanita	\N	\N	25	t
2258	ROBERTO VILLA	\N	\N	25	t
2259	Misc Nereida	\N	\N	25	t
2260	El Compa Juan	\N	\N	25	t
2261	Abarrotes Renteria	\N	\N	25	t
2262	Abarrotes Perez	\N	\N	25	t
2263	Miscelanea Pame	\N	\N	25	t
2264	Miscelanea La Luz	\N	\N	25	t
2265	Miscelanea Ebenezer	\N	\N	25	t
2266	Miscelanea La Providencia	\N	\N	25	t
2267	Abarrotes La Chaparrita	\N	\N	25	t
2268	La Pasadita	\N	\N	25	t
2269	Misc Rocio	\N	\N	25	t
2270	Miscelanea 11 De Julio	\N	\N	25	t
2271	Abarrotes Christian	\N	\N	25	t
2272	La Campesina	\N	\N	25	t
2273	Abarrotes Alvaroi	\N	\N	25	t
2274	LUZ MARIA ROMERO MARTINEZ	\N	\N	25	t
2275	Tortilleria La Unica	\N	\N	25	t
2276	Bravo Mini Super	\N	\N	25	t
2277	Mi Cabaña	\N	\N	25	t
2278	Minisuper Hermanos Paez	\N	\N	25	t
2279	Misc Juany	\N	\N	25	t
2280	El Chino	\N	\N	25	t
2281	Misc Alannie	\N	\N	25	t
2282	Varela	\N	\N	25	t
2283	Trebol	\N	\N	25	t
2284	Trebol # 2	\N	\N	25	t
2285	La Tiendita	\N	\N	25	t
2286	Miscelánea Y Papelería	\N	\N	25	t
2287	Farmacia Y Super Santa Elena	\N	\N	25	t
2288	La pasadita	\N	\N	25	t
2289	El Retoño	\N	\N	25	t
2290	Abarrotes Y Cremeria Fany	\N	\N	25	t
2291	Comedor	\N	\N	25	t
2292	Abarrotes Morelos	\N	\N	25	t
2293	Miscelánea El Tope	\N	\N	25	t
2294	Diconsa	\N	\N	25	t
2295	Tienda El Compa	\N	\N	25	t
2296	Nasdrim	\N	\N	25	t
2297	Minisuper Madai	\N	\N	25	t
2298	Azulejo Cafe	\N	\N	25	t
2299	La Esperanza	\N	\N	25	t
2300	Marylu	\N	\N	25	t
2301	Misc Aurora	\N	\N	25	t
2302	Miscelanea Los Perales	\N	\N	25	t
2303	Miscelanea Herrera	\N	\N	25	t
2304	Super Tana	\N	\N	25	t
2305	Miscelanea Angel	\N	\N	25	t
2306	Miscelanea Jardines	\N	\N	25	t
2307	Miscelanea Aracely	\N	\N	25	t
2308	Minisuper Giovanni	\N	\N	25	t
2309	La Rosita	\N	\N	25	t
2310	Misc.Sahira	\N	\N	25	t
2311	El Milagro	\N	\N	25	t
2312	SuperFenca	\N	\N	25	t
2313	Frutería Estrella	\N	\N	25	t
2314	Quiroga	\N	\N	25	t
2315	MinisuperErendira	\N	\N	25	t
2316	Mi tiendita	\N	\N	25	t
2317	Misc.Brenda	\N	\N	25	t
2318	Lolita	\N	\N	25	t
2319	Miscelanea Lucy	\N	\N	25	t
2320	La Tiendita de Rafa	\N	\N	25	t
2321	La Duana	\N	\N	25	t
2322	Abarrotes Jerez	\N	\N	25	t
2323	Super Lupita	\N	\N	25	t
2324	Venadito	\N	\N	25	t
2325	Misc Rocio	\N	\N	25	t
2326	Carlo	\N	\N	25	t
2327	Kanito	\N	\N	25	t
2328	Mari Fer	\N	\N	25	t
2329	Martha	\N	\N	25	t
2330	Deposito El Chido	\N	\N	25	t
2331	Mary	\N	\N	25	t
2332	Neveria Herrera	\N	\N	25	t
2333	Diconsa	\N	\N	25	t
2334	La Guadalupana	\N	\N	25	t
2335	La Morena	\N	\N	25	t
2336	Azucena	\N	\N	25	t
2337	Misc. Rosy	\N	\N	25	t
2338	Misc Ibarra	\N	\N	25	t
2339	Verde Convinado con piedra	\N	\N	25	t
2340	BERTHA ALICIA MAGAÑA CALVILLO	\N	\N	25	t
2341	Miscelanea José	\N	\N	25	t
2342	Miscelánea Sarahi	\N	\N	25	t
2343	Miscelanea Sarita	\N	\N	25	t
2344	Miscelánea Conchis	\N	\N	25	t
2345	Depósito El Manantial	\N	\N	25	t
2346	Miscelanea  Maylen	\N	\N	25	t
2347	Abarrotes Michoacan	\N	\N	25	t
2348	Miscelánea Daniela	\N	\N	25	t
2349	Miscelanea Olga	\N	\N	25	t
2350	Tortillería Los Laureles	\N	\N	25	t
2351	Mini Súper Aguirre	\N	\N	25	t
2352	Miscelanea La Palma	\N	\N	25	t
2353	Misc El Ocalipto	\N	\N	25	t
2354	Miscelánea Luz Elena	\N	\N	25	t
2355	Miscelanea Isa Y Gael	\N	\N	25	t
2356	Minisuper Ivan	\N	\N	25	t
2357	Ab Ruby	\N	\N	25	t
2358	Miscelanea Anita	\N	\N	25	t
2359	Mi Supercito	\N	\N	25	t
2360	Miscelánea La Oportunidad	\N	\N	25	t
2361	Misc Betancourt	\N	\N	25	t
2362	Esquina Naranja con café	\N	\N	25	t
2363	Verde con Gris	\N	\N	25	t
2364	Miscelánea Patricks	\N	\N	25	t
2365	Portón Negro	\N	\N	25	t
2366	Esquina adobe	\N	\N	25	t
2367	Blanco con Verde	\N	\N	25	t
2368	Abarrotes Hernández	\N	\N	25	t
2369	Abarrotes San Pedro	\N	\N	25	t
2370	Misc Andrea	\N	\N	25	t
2371	Natalya Quesada	\N	\N	25	t
2372	Rosaura	\N	\N	25	t
2373	La Esquina	\N	\N	25	t
2374	Abarrotes Arely	\N	\N	25	t
2375	Abarrotes La Huerta	\N	\N	26	t
2376	Rest Bar El Carnizon	\N	\N	26	t
2377	Abarrotes Esquina Sol	\N	\N	26	t
2378	Mini Super El Encanto	\N	\N	26	t
2379	El pueblito Comercializadora	\N	\N	26	t
2380	Misc Los Cuates	\N	\N	26	t
2381	Abarrotes Joyma	\N	\N	26	t
2382	Ab Jaquez	\N	\N	26	t
2383	Misc La Fruteria	\N	\N	26	t
2384	Amarilla # 9	\N	\N	26	t
2385	Abarrotes El Cielo	\N	\N	26	t
2386	Abarrotes Doña Toña	\N	\N	26	t
2387	Leo de Morales	\N	\N	26	t
2388	Abarrotes Aledan	\N	\N	26	t
2389	Misc La Perla	\N	\N	26	t
2390	abarrotes Bly	\N	\N	26	t
2391	Abarrotes	\N	\N	26	t
2392	Color Ladrillo	\N	\N	26	t
2393	Abarrotes Karla	\N	\N	26	t
2394	Super Color Naranja	\N	\N	26	t
2395	MARTHA ELENA HIDALGO VALDEZ	\N	\N	26	t
2396	Abarrotes Las Perlas	\N	\N	26	t
2397	Abarrotes y Carnicería El Mi	\N	\N	26	t
2398	Abarrotes La Palmilla	\N	\N	26	t
2399	Casa Amarilla	\N	\N	26	t
2400	Abarrotes Don Tomy	\N	\N	26	t
2401	Amarillo con tejas	\N	\N	26	t
2402	Naranja 2 pisos	\N	\N	26	t
2403	Abarrotes Victoria	\N	\N	26	t
2404	Abarrotes Brothers	\N	\N	26	t
2405	Abarrotes Andrea	\N	\N	26	t
2406	Abarrotes Javita 2	\N	\N	26	t
2407	Abarrotes El Lobito	\N	\N	26	t
2408	Panaderia La Rosita	\N	\N	26	t
2409	Super Santo Domingo	\N	\N	26	t
2410	Restaurant Mar y Tierra	\N	\N	26	t
2411	Abarrotes Sánchez	\N	\N	26	t
2412	Abarrotes DINNIS	\N	\N	26	t
2413	ROSALBA BARBOZA SANDOVAL	\N	\N	26	t
2414	Abarrotes Perez	\N	\N	26	t
2415	Misc. Gloria	\N	\N	26	t
2416	SOLEDAD SOLTERO ESCALANTE	\N	\N	26	t
2417	Abarrotes el Moño	\N	\N	26	t
2418	Super Estrela	\N	\N	26	t
2419	Super Avenida 357	\N	\N	26	t
2420	Abarrotes Canitos	\N	\N	26	t
2421	Abarrotes Morelos	\N	\N	26	t
2422	Misc. Verde con Piedra	\N	\N	26	t
2423	Los Venaos	\N	\N	26	t
2424	Abarrotes Los Angeles	\N	\N	26	t
2425	Misc. Suny	\N	\N	26	t
2426	Super 8AS	\N	\N	26	t
2427	Abarrotes Sofia	\N	\N	26	t
2428	Fruteria La Esmeralda	\N	\N	26	t
2429	Super Diana	\N	\N	26	t
2430	Tienda de Lupita	\N	\N	26	t
2431	Miscelanea Arcoiris	\N	\N	26	t
2432	Misc EL Parque	\N	\N	26	t
2433	Abarrotes La Infona	\N	\N	26	t
2434	Abarrotes Corona	\N	\N	26	t
2435	Autoservicio Los Jarales	\N	\N	26	t
2436	ABARROTES SIETE DE OCTUBRE	\N	\N	26	t
2437	Misc. Clic	\N	\N	26	t
2438	Super Fovissste	\N	\N	26	t
2439	Abarrotes Estrella	\N	\N	26	t
2440	Misc Bosco	\N	\N	26	t
2441	Abarrotes y Papeleria	\N	\N	26	t
2442	Misc. Blanco	\N	\N	26	t
2443	Abarrotes Jazmin	\N	\N	26	t
2444	Misc. Peñasco	\N	\N	26	t
2445	La Chiquita	\N	\N	26	t
2446	ANA CECILIA GARCIA SOLTERO	\N	\N	26	t
2447	ELIAN SAMIR SIERRA ESPARZA	\N	\N	26	t
2448	ABARROTES SIETE DE OCTUBRE	\N	\N	26	t
2449	Abarrotes Ofe	\N	\N	26	t
2450	Panchita Abarrotes	\N	\N	26	t
2451	San Jose de Felix	\N	\N	26	t
2452	Miss Angeles	\N	\N	26	t
2453	Abarrotes Bertha	\N	\N	26	t
2454	Abarrotes Salas	\N	\N	26	t
2455	Fruteria Los Galanes	\N	\N	26	t
2456	Misc. Blanco	\N	\N	26	t
2457	misc. El Arbolito	\N	\N	26	t
2458	Carniceria	\N	\N	26	t
2459	Puestecito	\N	\N	26	t
2460	Misc. de Adobe	\N	\N	26	t
2461	Misc. Asarco 35	\N	\N	26	t
2462	MiniSuper Cardona	\N	\N	26	t
2463	Fruteria	\N	\N	26	t
2464	Misc. Verde	\N	\N	26	t
2465	minisuper 3 Estrellas	\N	\N	26	t
2466	Abarrotes Jazmin	\N	\N	26	t
2467	Misc. Salas	\N	\N	26	t
2468	Don Charly	\N	\N	26	t
2469	Minisuper La Simpatia	\N	\N	26	t
2470	Misc. Marinela	\N	\N	26	t
2471	Abarrotes Sarahi	\N	\N	26	t
2472	Misc La Bonita	\N	\N	26	t
2473	Superez	\N	\N	26	t
2474	Misc. Tosti	\N	\N	26	t
2475	El Chilango	\N	\N	26	t
2476	Abarrotes Dominguez	\N	\N	26	t
2477	JOSE JUAN RAMIREZ RIOS	\N	\N	26	t
2478	Abarrotes Rosales	\N	\N	26	t
2479	Tienda Liconsa	\N	\N	26	t
2480	Abarrotes El Surtidor	\N	\N	26	t
2481	Misc. Gris 2 Pisos	\N	\N	26	t
2482	Abarrotes Mary	\N	\N	26	t
2483	Ojo de Toro	\N	\N	26	t
2484	Delta	\N	\N	26	t
2485	Abarrotes San Jose	\N	\N	26	t
2486	Abarrotes Micky	\N	\N	26	t
2487	Abarrotes Nava	\N	\N	26	t
2488	La Viña	\N	\N	26	t
2489	Super Max	\N	\N	26	t
2490	La Exquinita	\N	\N	26	t
2491	Super Angeles	\N	\N	26	t
2492	Fruteria Ramos	\N	\N	26	t
2493	Abarrotes La Morena	\N	\N	26	t
2494	Saulino	\N	\N	26	t
2495	FRUTERIA BODEGUITA	\N	\N	26	t
2496	Misc. Cafe Combinada	\N	\N	26	t
2497	Abarrotes Puebla	\N	\N	26	t
2498	Super La Mariposa	\N	\N	26	t
2499	Abarrotes Rivera	\N	\N	26	t
2500	Carmelita	\N	\N	26	t
2501	Misc Gloria	\N	\N	26	t
2502	Miscelanea Deportiva	\N	\N	26	t
2503	Misc Don Chuy	\N	\N	27	t
2504	Misc Luna	\N	\N	27	t
2505	Gorditas Nay	\N	\N	27	t
2506	Misc Cielito Lindo	\N	\N	27	t
2507	BRENDA JOAQUINA GALINDO REYES	\N	\N	27	t
2508	SANTURIN	\N	\N	27	t
2509	BAKERMAN	\N	\N	27	t
2510	Misc La Texana	\N	\N	27	t
2511	HOTEL GOBERNADOR	\N	\N	27	t
2512	Gorditas Belem	\N	\N	27	t
2513	Restaurant Ramonas	\N	\N	27	t
2514	Gorditas Libertad	\N	\N	27	t
2515	Misc Cent	\N	\N	27	t
2516	Misc Caro	\N	\N	27	t
2517	Misc. San Jose	\N	\N	27	t
2518	Gorditas Rosi	\N	\N	27	t
2519	Gorditas El Centauro	\N	\N	27	t
2520	Abarrotes El Paisa	\N	\N	27	t
2521	Misc. Las Mariposas	\N	\N	27	t
2522	Centavito 3	\N	\N	27	t
2523	Misc La Paloma	\N	\N	27	t
2524	Misc. Los Pinos	\N	\N	27	t
2525	SUPER Y CARNICERIA RODARTE	\N	\N	27	t
2526	Fruteria Durazno	\N	\N	27	t
2527	Misc La Vaquita	\N	\N	27	t
2528	Misc y Papeleria Martilla	\N	\N	27	t
2529	Misc El Kokeno	\N	\N	27	t
2530	Misc. Miguelito	\N	\N	27	t
2531	Gordas y Burritos	\N	\N	27	t
2532	Misc. Adelaida	\N	\N	27	t
2533	Misc. Socorrito	\N	\N	27	t
2534	Tienda La Chiquita	\N	\N	27	t
2535	Misc Valadez	\N	\N	27	t
2536	Misc Gordito 110	\N	\N	27	t
2537	Misc Andrik	\N	\N	27	t
2538	Misc. Herfri	\N	\N	27	t
2539	El Garaje	\N	\N	27	t
2540	BISTRO BAR	\N	\N	27	t
2541	KATIA KASSANDRA CARDENAS PEREZ	\N	\N	27	t
2542	Jardin De Los Canarios	\N	\N	27	t
2543	MIGUEL ANGEL GUERECA RODRIGUEZ	\N	\N	27	t
2544	ANDREA JAHEL MUÑOZ GARCIA	\N	\N	27	t
2545	Misc Los Morritos	\N	\N	27	t
2546	Gorditas Citlaly	\N	\N	27	t
2547	Miscelánea Aracely	\N	\N	27	t
2548	Miscelánea el Yaki 2	\N	\N	27	t
2549	HECTOR MALDONADO VILLANUEVA	\N	\N	27	t
2550	Fruteria DABA	\N	\N	27	t
2551	Gorditas y Burritos Arlene	\N	\N	27	t
2552	Miscelánea El Porvenir	\N	\N	27	t
2553	MARICELA MONARREZ CONTRERAS	\N	\N	27	t
2554	MARIA CONCEPCION VARGAS OCHOA	\N	\N	27	t
2555	Miscelánea La Pequeña	\N	\N	27	t
2556	Carnicería Don Elias	\N	\N	27	t
2557	Miscelánea Thaly	\N	\N	27	t
2558	Mini Súper Los Angelitos	\N	\N	27	t
2559	Miscelánea Sofía	\N	\N	27	t
2560	Cafetería Los Ángeles	\N	\N	27	t
2561	FONDO DE SALUD Y CULTURA	\N	\N	27	t
2562	LUZ GABRIELA ROSALES HERRERA	\N	\N	27	t
2563	ABARROTES VENEGAS	\N	\N	27	t
2564	Miscelánea el sobrino	\N	\N	27	t
2565	MARIA DEL CARMEN ARELLANO DE LA PAZ	\N	\N	27	t
2566	Panadería De La Rosa	\N	\N	27	t
2567	Miscelánea Campanita	\N	\N	27	t
2568	Minisuper FC	\N	\N	27	t
2569	miscelanea Tere	\N	\N	27	t
2570	Miscelánea junior	\N	\N	27	t
2571	Miscelanea Sol	\N	\N	27	t
2572	Misc Gorditas	\N	\N	27	t
2573	Miscelanea Tony	\N	\N	28	t
2574	Miscelanea Gaby	\N	\N	28	t
2575	Miscelanea Mi Tiendita	\N	\N	28	t
2576	Miscelanea Kassandra	\N	\N	28	t
2577	Super Mas 2	\N	\N	28	t
2578	Miscelanea Sarahi	\N	\N	28	t
2579	Misc Elier	\N	\N	28	t
2580	Misc Frida	\N	\N	28	t
2581	TIENDAS SIERRA DEL AHORRO	\N	\N	28	t
2582	Los Rivera	\N	\N	28	t
2583	Misc AR	\N	\N	28	t
2584	LISVANY MARRERO HURTADO	\N	\N	28	t
2585	Internet y Copias ó MISC Roxana	\N	\N	28	t
2586	GUADALUPE PONCE RIVERA	\N	\N	28	t
2587	La nene	\N	\N	28	t
2588	Misc Las Gueras	\N	\N	28	t
2589	Miscelánea Verde Con Piedra	\N	\N	28	t
2590	Minisuper El Rosario	\N	\N	28	t
2591	Minisuper 3 Estrellas	\N	\N	28	t
2592	Los Chavez	\N	\N	28	t
2593	Miscelánea Amarillo con Lamina	\N	\N	28	t
2594	Miscelanea Andy	\N	\N	28	t
2595	Miscelanea Super Jevos	\N	\N	28	t
2596	Miscelanea Santillan	\N	\N	28	t
2597	Miscelanea Morelos	\N	\N	28	t
2598	Miscelanea El Primo	\N	\N	28	t
2599	Rio Dorado	\N	\N	28	t
2600	La Escondida	\N	\N	28	t
2601	Tiendita Color Ladrillo Con Lamina	\N	\N	28	t
2602	Miscelánea Cafe	\N	\N	28	t
2603	Miscelánea Árbol Verde	\N	\N	28	t
2604	Super Carniceria Barraza	\N	\N	28	t
2605	Miscelánea Gil	\N	\N	28	t
2606	Azul con puerta Blanca	\N	\N	28	t
2607	Puertas de Cristal	\N	\N	28	t
2608	Tacos y pizzas Vela	\N	\N	28	t
2609	Miscelánea Michelle	\N	\N	28	t
2610	Misc Sammy	\N	\N	28	t
2611	Porton Café	\N	\N	28	t
2612	Super Palacios	\N	\N	28	t
2613	Misc Luciana	\N	\N	28	t
2614	EL Arbol Verde	\N	\N	28	t
2615	Misc Miranda	\N	\N	28	t
2616	Misc Azul	\N	\N	28	t
2617	Misc Coquito	\N	\N	28	t
2618	Fruteria La Loma	\N	\N	28	t
2619	La Villita	\N	\N	28	t
2620	Misc Misael	\N	\N	28	t
2621	Misc Maria	\N	\N	28	t
2622	Misc Dayeleta II	\N	\N	28	t
2623	Misc Leo	\N	\N	28	t
2624	Tortilleria	\N	\N	28	t
2625	Misc. Gaby	\N	\N	28	t
2626	Manuel de Jesus	\N	\N	28	t
2627	Misc Luka	\N	\N	28	t
2628	Misc. Mague	\N	\N	28	t
2629	Misc. Don Toño	\N	\N	28	t
2630	Misc. Palmira	\N	\N	28	t
2631	Misc. Lopez	\N	\N	28	t
2632	Dulceria Paola	\N	\N	28	t
2633	Misc. Obed	\N	\N	28	t
2634	Misc. Mi Tiendita	\N	\N	28	t
2635	Esperanza Castillo	\N	\N	28	t
2636	Misc. La Pasadita	\N	\N	28	t
2637	Misc. Karen	\N	\N	28	t
2638	Misc. La Esquina	\N	\N	28	t
2639	Misc. Chayito	\N	\N	28	t
2640	Dulceria Juana	\N	\N	28	t
2641	Misc. Yolanda	\N	\N	28	t
2642	Gorditas Yareli	\N	\N	28	t
2643	Ab Ana Maria	\N	\N	28	t
2644	Misc. Elvita Lizeth	\N	\N	28	t
2645	Misc.Roxana	\N	\N	28	t
2646	Ab Kikis	\N	\N	28	t
2647	Misc. Las Gemelas	\N	\N	28	t
2648	Misc. Lupita	\N	\N	28	t
2649	Misc. Fati	\N	\N	28	t
2650	Misc. Chavita	\N	\N	28	t
2651	Ab. Río	\N	\N	28	t
2652	Misc. Cantaranas	\N	\N	28	t
2653	Misc. Clarita	\N	\N	28	t
2654	Misc. Valencia	\N	\N	28	t
2655	Anabel Cruz	\N	\N	28	t
2656	Diconsa	\N	\N	28	t
2657	Misc. Gloria	\N	\N	28	t
2658	Misc. Bety	\N	\N	28	t
2659	Misc. Becky	\N	\N	28	t
2660	Misc. Carmen	\N	\N	28	t
2661	Misc. Marinet´S	\N	\N	28	t
2662	Misc. Noe	\N	\N	28	t
2663	Misc Mis 3 Amores	\N	\N	29	t
2664	Miscelanea Casa Blanca	\N	\N	29	t
2665	Super Cherrys	\N	\N	29	t
2666	Misc Luna	\N	\N	29	t
2667	Ab EL Chiquillo	\N	\N	29	t
2668	Mini Super Lucy	\N	\N	29	t
2669	Mini Super Mini Mundo	\N	\N	29	t
2670	Abarrotes El Oleck	\N	\N	29	t
2671	Mini Super Corral de Piedra	\N	\N	29	t
2672	Frutas y Abarrotes El Canasto	\N	\N	29	t
2673	Gorditas Sofia	\N	\N	29	t
2674	Misc Grijalva	\N	\N	29	t
2675	Misc Tadeo	\N	\N	29	t
2676	Misc Madali	\N	\N	29	t
2677	Tortilleria Santa Clara	\N	\N	29	t
2678	Antojitos para dos	\N	\N	29	t
2679	La + Barata	\N	\N	29	t
2680	Misc Fabi	\N	\N	29	t
2681	Super Tienda Abba	\N	\N	29	t
2682	Misc Lucy	\N	\N	29	t
2683	Mini Super  Armando	\N	\N	29	t
2684	Misc Armando II	\N	\N	29	t
2685	Misc Armando III	\N	\N	29	t
2686	LUIS RODOLFO SALCIDO MEJIA	\N	\N	29	t
2687	Miscelánea Acme	\N	\N	29	t
2688	Miscelanea Don Jose	\N	\N	29	t
2689	Miscelánea Mary	\N	\N	29	t
2690	Mini Super HC	\N	\N	29	t
2691	Gorditas Lety	\N	\N	29	t
2692	MIREYA GUADALUPE ALDAY JIMENEZ	\N	\N	29	t
2693	Misc. Mis 4 Amores	\N	\N	29	t
2694	Miscelánea Juan Pablo II	\N	\N	29	t
2695	Gorditas Coronado	\N	\N	29	t
2696	Jesus Arturo 4	\N	\N	29	t
2697	Misc.450	\N	\N	29	t
2698	The Antojitos	\N	\N	29	t
2699	Miscelánea Edwin	\N	\N	29	t
2700	Miscelánea Ortega	\N	\N	29	t
2701	Miscelánea Kory	\N	\N	29	t
2702	Super Sierra Madre	\N	\N	29	t
2703	Mega Gorda Lety	\N	\N	29	t
2704	Gorditas Martitha	\N	\N	29	t
2705	Loncheria Cruz	\N	\N	29	t
2706	Miscelánea Angeles	\N	\N	29	t
2707	Misc Pakito	\N	\N	29	t
2708	Miscelanea Yios	\N	\N	29	t
2709	Miscelanea Dolly	\N	\N	29	t
2710	Zulema	\N	\N	29	t
2711	Miscelanea Lety	\N	\N	29	t
2712	Gorditas Carsy	\N	\N	29	t
2713	Miscelanea Adri	\N	\N	29	t
2714	Luciana	\N	\N	29	t
2715	El Roble	\N	\N	29	t
2716	Miscelanea Alejandra	\N	\N	29	t
2717	Porton Café	\N	\N	29	t
2718	Tortilleria Manantial	\N	\N	29	t
2719	Miscelanea Axel	\N	\N	29	t
2720	Miscelanea Mayito	\N	\N	29	t
2721	Miscelanea La Fe	\N	\N	29	t
2722	Miscelanea Ale	\N	\N	29	t
2723	Miscelanea Alison	\N	\N	29	t
2724	Los Cachorros	\N	\N	29	t
2725	Telechobis	\N	\N	29	t
2726	Jorge Alfredo Canuto Romero	\N	\N	29	t
2727	Miscelanea Tía Irene	\N	\N	29	t
2728	El Dorado	\N	\N	29	t
2729	JESUS ARTURO ESCANDON AMEZAGA	\N	\N	29	t
2730	Six Mary	\N	\N	31	t
2731	Misc Fatima	\N	\N	31	t
2732	Misc Charly	\N	\N	31	t
2733	Jose Luis	\N	\N	31	t
2734	Erika	\N	\N	31	t
2735	Codigo Disponible	\N	\N	31	t
2736	Ingrid	\N	\N	31	t
2737	Paola	\N	\N	31	t
2738	Jessica	\N	\N	31	t
2739	Codigo Disponible	\N	\N	31	t
2740	Codigo Disponible	\N	\N	31	t
2741	Codigo Disponible	\N	\N	31	t
2742	Codigo Disponible	\N	\N	31	t
2743	Codigo Disponible	\N	\N	31	t
2744	Codigo Disponible	\N	\N	31	t
2745	Codigo Disponible	\N	\N	31	t
2746	Codigo Disponible	\N	\N	31	t
2747	Codigo Disponible	\N	\N	31	t
2748	Codigo Disponible	\N	\N	31	t
2749	Codigo Disponible	\N	\N	31	t
2750	Codigo Disponible	\N	\N	31	t
2751	Codigo Disponible	\N	\N	31	t
2752	Codigo Disponible	\N	\N	31	t
2753	Codigo Disponible	\N	\N	31	t
2754	Codigo Disponible	\N	\N	31	t
2755	Codigo Disponible	\N	\N	31	t
2756	Codigo Disponible	\N	\N	31	t
2757	Codigo Disponible	\N	\N	31	t
2758	Codigo Disponible	\N	\N	31	t
2759	Codigo Disponible	\N	\N	31	t
2760	Codigo Disponible	\N	\N	31	t
2761	Codigo Disponible	\N	\N	31	t
2762	Codigo Disponible	\N	\N	31	t
2763	Codigo Disponible	\N	\N	31	t
2764	Codigo Disponible	\N	\N	31	t
2765	Codigo Disponible	\N	\N	31	t
2766	Codigo Disponible	\N	\N	31	t
2767	Codigo Disponible	\N	\N	31	t
2768	Codigo Disponible	\N	\N	31	t
2769	Codigo Disponible	\N	\N	31	t
2770	Codigo Disponible	\N	\N	31	t
2771	Codigo Disponible	\N	\N	31	t
2772	Codigo Disponible	\N	\N	31	t
2773	Codigo Disponible	\N	\N	31	t
2774	Codigo Disponible	\N	\N	31	t
2775	Codigo Disponible	\N	\N	31	t
2776	Codigo Disponible	\N	\N	31	t
2777	Codigo Disponible	\N	\N	31	t
2778	Codigo Disponible	\N	\N	31	t
2779	Codigo Disponible	\N	\N	31	t
2780	Codigo Disponible	\N	\N	31	t
2781	Codigo Disponible	\N	\N	31	t
2782	Codigo Disponible	\N	\N	31	t
2783	Codigo Disponible	\N	\N	31	t
2784	Codigo Disponible	\N	\N	31	t
2785	Codigo Disponible	\N	\N	31	t
2786	Codigo Disponible	\N	\N	31	t
2787	Codigo Disponible	\N	\N	31	t
2788	Codigo Disponible	\N	\N	31	t
2789	Codigo Disponible	\N	\N	31	t
2790	Codigo Disponible	\N	\N	31	t
2791	Codigo Disponible	\N	\N	31	t
2792	Codigo Disponible	\N	\N	31	t
2793	Codigo Disponible	\N	\N	31	t
2794	Codigo Disponible	\N	\N	31	t
2795	Codigo Disponible	\N	\N	31	t
2796	Codigo Disponible	\N	\N	31	t
2797	Codigo Disponible	\N	\N	31	t
2798	Codigo Disponible	\N	\N	31	t
2799	Codigo Disponible	\N	\N	31	t
2800	Codigo Disponible	\N	\N	31	t
2801	Codigo Disponible	\N	\N	31	t
2802	Codigo Disponible	\N	\N	31	t
2803	Codigo Disponible	\N	\N	31	t
2804	Codigo Disponible	\N	\N	31	t
2805	Codigo Disponible	\N	\N	31	t
2806	Codigo Disponible	\N	\N	31	t
2807	Codigo Disponible	\N	\N	31	t
2808	Codigo Disponible	\N	\N	31	t
2809	Codigo Disponible	\N	\N	31	t
2810	JUANA JUDITH DE LA SERNA MALDONADO	\N	\N	32	t
2811	Misc Alex	\N	\N	32	t
2812	Misc Martha	\N	\N	32	t
2813	Mic Noelia	\N	\N	32	t
2814	Misc Los 3 Garcia	\N	\N	32	t
2815	Misc Sta Elena	\N	\N	32	t
2816	Misc El Mineral	\N	\N	32	t
2817	Misc Sto Remedio	\N	\N	32	t
2818	Misc Perla	\N	\N	32	t
2819	Ab y Exp Alex	\N	\N	32	t
2820	Misc 3 Rios	\N	\N	32	t
2821	Misc La Pasadita	\N	\N	32	t
2822	La Tiendita de Nenis	\N	\N	32	t
2823	Misc Coco	\N	\N	32	t
2824	Mini Super Adan 2	\N	\N	32	t
2825	Misc Estrella	\N	\N	32	t
2826	Misc Maria	\N	\N	32	t
2827	Cafeteria Mi  Ranchito	\N	\N	32	t
2828	Misc La Panuqueña	\N	\N	32	t
2829	Misc Alondra	\N	\N	32	t
2830	El Paraiso	\N	\N	32	t
2831	Marce	\N	\N	32	t
2832	La Tiendita Azul	\N	\N	32	t
2833	Gorditas Morales	\N	\N	32	t
2834	Misc Ale	\N	\N	32	t
2835	Carniceria La Borrosa	\N	\N	32	t
2836	Gorditas lulu	\N	\N	32	t
2837	Carniceria El Nano	\N	\N	32	t
2838	Mini Super Jona	\N	\N	32	t
2839	El Taste	\N	\N	32	t
2840	Tiendita La Reyna	\N	\N	32	t
2841	Misc Maricarmen	\N	\N	32	t
2842	Misc Pasadita	\N	\N	32	t
2843	Misc Yikes	\N	\N	32	t
2844	Misc Estacion	\N	\N	32	t
2845	Misc La Placita	\N	\N	32	t
2846	Fruteria Angel	\N	\N	32	t
2847	Villa del Rio	\N	\N	32	t
2848	Misc Kely	\N	\N	32	t
2849	Gorditas Paty	\N	\N	32	t
2850	MARIA AZUCENA SAUCEDO RAMOS	\N	\N	32	t
2851	Cocina Eco La Estacion	\N	\N	32	t
2852	Misc La Pasadita	\N	\N	32	t
2853	La Escondida	\N	\N	32	t
2854	Misc Los Puentes	\N	\N	32	t
2855	Misc Lupita	\N	\N	32	t
2856	Misc Alvarado	\N	\N	32	t
2857	Misc La Colorada	\N	\N	32	t
2858	4 Hermanos	\N	\N	32	t
2859	Misc Reyes	\N	\N	32	t
2860	La Esperanza	\N	\N	32	t
2861	Tortilleria	\N	\N	32	t
2862	Ontiveros	\N	\N	32	t
2863	Gorditas Mela	\N	\N	32	t
2864	Super El Peñón	\N	\N	32	t
2865	Codigo Disponible	\N	\N	32	t
2866	SANDRA VERONICA VILLARREAL ARRITOLA	\N	\N	32	t
2867	Mini Super El Mercadito	\N	\N	32	t
2868	Tortilleria 4 Milpas	\N	\N	32	t
2869	Super 15	\N	\N	32	t
2870	Misc Cecy	\N	\N	32	t
2871	Tienda sin Pintar	\N	\N	32	t
2872	Tortilleria Perlita	\N	\N	32	t
2873	Mini Super Navarro	\N	\N	32	t
2874	Miscelánea Mi Tiendita	\N	\N	32	t
2875	MiniSuper Chester	\N	\N	32	t
2876	Miscelánea Adan	\N	\N	32	t
2877	Dario	\N	\N	32	t
2878	Miscelánea Marely	\N	\N	32	t
2879	Super y Tortillería Mega	\N	\N	32	t
2880	Super Mega	\N	\N	32	t
2881	Super B. H.	\N	\N	32	t
2882	Miscelánea  Liz	\N	\N	32	t
2883	Rest. Mexicanisimo	\N	\N	32	t
2884	Misc. Sorianita con Laminas	\N	\N	32	t
2885	Carniceria La Ternera	\N	\N	32	t
2886	Miscelánea Mayra	\N	\N	32	t
2887	Comedor Doña Chava	\N	\N	32	t
2888	Miscelánea Bethy	\N	\N	32	t
2889	Miscelánea La Hacienda	\N	\N	32	t
2890	Super C	\N	\N	32	t
2891	Abarrotes Violeta	\N	\N	32	t
2892	Misc Naty	\N	\N	32	t
2893	Misc Norma	\N	\N	32	t
2894	Abarrotes Leo	\N	\N	32	t
2895	Carniceria	\N	\N	32	t
2896	Misc Liz	\N	\N	32	t
2897	Misc sanaya	\N	\N	32	t
2898	Gorditas Pau	\N	\N	32	t
2899	Misc Samantha	\N	\N	32	t
2900	Misc El Sr del Huevo	\N	\N	32	t
2901	Ab. Valenzuela	\N	\N	32	t
2902	Comedor Las Casuelas	\N	\N	32	t
2903	Super Ramos (Guadalupe Victoria, Dgo)	\N	\N	32	t
2904	Misc. Doña Lupita	\N	\N	32	t
2905	Misc. Muro	\N	\N	32	t
2906	Abarrotes El Ranchito	\N	\N	32	t
2907	Paso a la Paz	\N	\N	32	t
2908	Cocina Economica	\N	\N	32	t
2909	Misc S/N	\N	\N	32	t
2910	Misc Dany	\N	\N	32	t
2911	Misc Maria	\N	\N	32	t
2912	Misc. La Ventanita	\N	\N	32	t
2913	Misc Chávez	\N	\N	32	t
2914	Misc Doña Lupe	\N	\N	32	t
2915	Abarrotes Cinthia	\N	\N	32	t
2916	Misc Jessica	\N	\N	32	t
2917	El Mundo Del Pollo	\N	\N	32	t
2918	Frutria El Limoncito	\N	\N	32	t
2919	CARNICERIAS Y MAS DON MIGUEL	\N	\N	32	t
2920	Super Lozano	\N	\N	32	t
2921	Pollo Asado Mary Yel Güero	\N	\N	32	t
2922	Misc. La Morena	\N	\N	32	t
2923	Misc S/N	\N	\N	32	t
2924	Super Mi Pequeño Angel	\N	\N	32	t
2925	Taquería Doña María	\N	\N	32	t
2926	Mini Super Paquito	\N	\N	32	t
2927	Misc Lucy	\N	\N	32	t
2928	Misc Mercedes	\N	\N	32	t
2929	Antojitos El Paradero	\N	\N	32	t
2930	Ab Hernandez	\N	\N	32	t
2931	Deposito Calixto Contreras	\N	\N	32	t
2932	La Casita	\N	\N	32	t
2933	Misc La Espacial	\N	\N	32	t
2934	Misc Doña Chencha	\N	\N	32	t
2935	Abarrotes Pulido	\N	\N	32	t
2936	Corral de Piedra	\N	\N	32	t
2937	la Pasadita	\N	\N	32	t
2938	Plaza Juarez	\N	\N	32	t
2939	Misc Manantial	\N	\N	32	t
2940	Misc La Concha	\N	\N	32	t
2941	La Chirris	\N	\N	32	t
2942	El Marro	\N	\N	32	t
2943	Misc Jenny	\N	\N	32	t
2944	Misc Arancibia	\N	\N	32	t
2945	Las Pollas	\N	\N	32	t
2946	Las Flores	\N	\N	32	t
2947	Misc Karina	\N	\N	32	t
2948	Misc Velazquez	\N	\N	32	t
2949	Misc Martinez	\N	\N	32	t
2950	Misc Vicky	\N	\N	32	t
2951	Misc EL Domo	\N	\N	32	t
2952	Misc Mi Tiendita	\N	\N	32	t
2953	Misc Alondra	\N	\N	32	t
2954	Misc La Pasadita	\N	\N	32	t
2955	Misc Vero	\N	\N	32	t
2956	Misc La Espiga	\N	\N	32	t
2957	Super y Carnicería Miguel y Miguel	\N	\N	32	t
2958	Misc Arancibia	\N	\N	32	t
2959	TIENDAS SIERRA DEL AHORRO	\N	\N	33	t
2960	Cremeria Victoria	\N	\N	33	t
2961	Frureria El Limioncito	\N	\N	33	t
2962	Codigo Disponible	\N	\N	33	t
2963	Codigo Disponible	\N	\N	33	t
2964	Codigo Disponible	\N	\N	33	t
2965	Codigo Disponible	\N	\N	33	t
2966	Codigo Disponible	\N	\N	33	t
2967	Codigo Disponible	\N	\N	33	t
2968	Codigo Disponible	\N	\N	33	t
2969	Codigo Disponible	\N	\N	33	t
2970	Codigo Disponible	\N	\N	33	t
2971	Codigo Disponible	\N	\N	33	t
2972	Codigo Disponible	\N	\N	33	t
2973	Codigo Disponible	\N	\N	33	t
2974	Codigo Disponible	\N	\N	33	t
2975	Codigo Disponible	\N	\N	33	t
2976	Codigo Disponible	\N	\N	33	t
2977	Codigo Disponible	\N	\N	33	t
2978	Codigo Disponible	\N	\N	33	t
2979	Codigo Disponible	\N	\N	33	t
2980	Codigo Disponible	\N	\N	33	t
2981	Codigo Disponible	\N	\N	33	t
2982	Codigo Disponible	\N	\N	33	t
2983	Codigo Disponible	\N	\N	33	t
2984	Codigo Disponible	\N	\N	33	t
2985	Codigo Disponible	\N	\N	33	t
2986	Codigo Disponible	\N	\N	33	t
2987	Codigo Disponible	\N	\N	33	t
2988	Codigo Disponible	\N	\N	33	t
2989	Codigo Disponible	\N	\N	33	t
2990	Codigo Disponible	\N	\N	33	t
2991	Codigo Disponible	\N	\N	33	t
2992	Codigo Disponible	\N	\N	33	t
2993	Codigo Disponible	\N	\N	33	t
2994	Codigo Disponible	\N	\N	33	t
2995	Codigo Disponible	\N	\N	33	t
2996	Codigo Disponible	\N	\N	33	t
2997	Codigo Disponible	\N	\N	33	t
2998	Codigo Disponible	\N	\N	33	t
2999	Codigo Disponible	\N	\N	33	t
3000	Codigo Disponible	\N	\N	33	t
3001	Codigo Disponible	\N	\N	33	t
3002	Codigo Disponible	\N	\N	33	t
3003	Codigo Disponible	\N	\N	33	t
3004	Codigo Disponible	\N	\N	33	t
3005	Codigo Disponible	\N	\N	33	t
3006	Codigo Disponible	\N	\N	33	t
3007	Codigo Disponible	\N	\N	33	t
3008	Codigo Disponible	\N	\N	33	t
3009	Codigo Disponible	\N	\N	33	t
3010	Codigo Disponible	\N	\N	33	t
3011	Codigo Disponible	\N	\N	33	t
3012	Codigo Disponible	\N	\N	33	t
3013	Codigo Disponible	\N	\N	33	t
3014	Codigo Disponible	\N	\N	33	t
3015	Codigo Disponible	\N	\N	33	t
3016	Codigo Disponible	\N	\N	33	t
3017	Codigo Disponible	\N	\N	33	t
3018	Codigo Disponible	\N	\N	33	t
3019	Codigo Disponible	\N	\N	33	t
3020	Codigo Disponible	\N	\N	33	t
3021	Codigo Disponible	\N	\N	33	t
3022	Codigo Disponible	\N	\N	33	t
3023	Codigo Disponible	\N	\N	33	t
3024	Codigo Disponible	\N	\N	33	t
3025	Codigo Disponible	\N	\N	33	t
3026	Codigo Disponible	\N	\N	33	t
3027	Codigo Disponible	\N	\N	33	t
3028	Codigo Disponible	\N	\N	33	t
3029	Codigo Disponible	\N	\N	33	t
3030	Codigo Disponible	\N	\N	33	t
3031	Codigo Disponible	\N	\N	33	t
3032	Codigo Disponible	\N	\N	33	t
3033	Codigo Disponible	\N	\N	33	t
3034	Codigo Disponible	\N	\N	33	t
3035	Codigo Disponible	\N	\N	33	t
3036	Codigo Disponible	\N	\N	33	t
3037	Codigo Disponible	\N	\N	33	t
3038	Codigo Disponible	\N	\N	33	t
3039	Carniceria Mr Soria 2	\N	\N	34	t
3040	Misc Torres	\N	\N	34	t
3041	Fruteria Doctor Victima	\N	\N	34	t
3042	Cremeria Haburgo	\N	\N	34	t
3043	La Tiendita	\N	\N	34	t
3044	Miscelanea Toby	\N	\N	34	t
3045	Mini Super Irais	\N	\N	34	t
3046	Carniceria Las Colinas	\N	\N	34	t
3047	El Supercito	\N	\N	34	t
3048	Mini Super Everest	\N	\N	34	t
3049	Miscelanea Martina	\N	\N	34	t
3050	DULCE MARISOL LOPEZ ZAMUDIO	\N	\N	34	t
3051	Misc La Pequeña II	\N	\N	34	t
3052	Miscelanea YO KELO	\N	\N	34	t
3053	Fruteria La Esperanza	\N	\N	34	t
3054	TKT Six Diaz Ordaz	\N	\N	34	t
3055	Miscelanea El Tio	\N	\N	34	t
3056	Miscelanea Alma	\N	\N	34	t
3057	Miscelanea El Angel	\N	\N	34	t
3058	Miscelanea El Buen Samaritano	\N	\N	34	t
3059	Misc Iker	\N	\N	34	t
3060	Misc Saher	\N	\N	34	t
3061	Carniceria y Miscelanea Yesy	\N	\N	34	t
3062	Mini Super El Girasol	\N	\N	34	t
3063	Yadira	\N	\N	34	t
3064	4 Estrellas	\N	\N	34	t
3065	Abarrotes La Florida	\N	\N	34	t
3066	Miscelanea Mimi	\N	\N	34	t
3067	Miscelanea Fox	\N	\N	34	t
3068	Misc Hermanos Sosa	\N	\N	34	t
3069	Miscelanea Mague	\N	\N	34	t
3070	Fruteria Y Cremera El Bebe 2	\N	\N	34	t
3071	Miscelanea Lisma	\N	\N	34	t
3072	Miscelanea Chuyin	\N	\N	34	t
3073	MA. LOURDES VILLAPUDUA ROBLEDO	\N	\N	34	t
3074	Carniceria Veronica	\N	\N	34	t
3075	Super Sol	\N	\N	34	t
3076	MiniMarket Montez	\N	\N	34	t
3077	Miscelanea Aurora	\N	\N	34	t
3078	Fruteria Los Carnales	\N	\N	34	t
3079	Miscelanea Yolis	\N	\N	34	t
3080	Miscelanea Nayar II	\N	\N	34	t
3081	Carniceria Victoria	\N	\N	34	t
3082	La Privada	\N	\N	34	t
3083	Misc Doctor Victima y sus Victimitas	\N	\N	34	t
3084	MARIA GUADALUPE RODRIGUEZ CABRAL	\N	\N	34	t
3085	Abarrotes Kasandra	\N	\N	34	t
3086	RICARDO CASTILLO ROJAS	\N	\N	34	t
3087	Dany	\N	\N	34	t
3088	Super Los Flamingos	\N	\N	34	t
3089	Pily	\N	\N	34	t
3090	Carniceria El Novillo	\N	\N	34	t
3091	Súper Marchal I	\N	\N	34	t
3092	Lili	\N	\N	34	t
3093	Fruteria Nueva	\N	\N	34	t
3094	IVAN URIEL RODRIGUEZ RIVERA	\N	\N	34	t
3095	Uruapan	\N	\N	34	t
3096	Pimpoya	\N	\N	34	t
3097	Ale Ale	\N	\N	34	t
3098	EbenEzer	\N	\N	34	t
3099	Torres	\N	\N	34	t
3100	Ana	\N	\N	34	t
3101	Shushulukos	\N	\N	34	t
3102	Rocha	\N	\N	34	t
3103	Karen	\N	\N	34	t
3104	Super 7-11	\N	\N	34	t
3105	Gina	\N	\N	34	t
3106	Rivas	\N	\N	34	t
3107	Lety	\N	\N	34	t
3108	Carmelita	\N	\N	34	t
3109	Karen	\N	\N	34	t
3110	Las Delicias  De  Erik	\N	\N	34	t
3111	Miscelanea Las Calandrias	\N	\N	34	t
3112	Cristy	\N	\N	34	t
3113	Carniceria Mejorado	\N	\N	34	t
3114	Gaby	\N	\N	34	t
3115	Mimi Market	\N	\N	34	t
3116	Mi Tiendita	\N	\N	34	t
3117	Bip Bip	\N	\N	34	t
3118	El Abuelo	\N	\N	34	t
3119	Ximena	\N	\N	34	t
3120	JUAN FELIZARDO MORENO SAUCEDA	\N	\N	34	t
3121	Carniceria T- Bone	\N	\N	34	t
3122	JAZMIN DALETH SANCHEZ GONZALEZ	\N	\N	34	t
3123	El Guero	\N	\N	34	t
3124	Super Marchal II	\N	\N	34	t
3125	El Angel	\N	\N	34	t
3126	Supercito	\N	\N	34	t
3127	Antojitos Julia	\N	\N	34	t
3128	Miscelanea El Manjar	\N	\N	34	t
3129	Misc Ameyally	\N	\N	34	t
3130	Miscelanea El Cambio	\N	\N	34	t
3131	Miscelanea Ortiz	\N	\N	34	t
3132	Miscelanea Chely	\N	\N	34	t
3133	GERARDO FRANCISCO RIOS MATA	\N	\N	34	t
3134	Miscelanea Yessy	\N	\N	34	t
3135	Mini Super El Avion	\N	\N	34	t
3136	Fruteria y Cremeria Fatima	\N	\N	34	t
3137	Tortilleria Las Delicias	\N	\N	34	t
3138	Miscelanea Don Pancho	\N	\N	34	t
3139	Miscelanea Aurelia	\N	\N	34	t
3140	Miscelanea Lolis	\N	\N	34	t
3141	Miscelanea Peñas	\N	\N	34	t
3142	Súper Christian	\N	\N	34	t
3143	Birrieria Jau	\N	\N	34	t
3144	Miscelanea El Manantial	\N	\N	34	t
3145	Fruteria Hnos Luna	\N	\N	34	t
3146	Misc. La Teka	\N	\N	34	t
3147	Misc. Del Bosque	\N	\N	34	t
3148	Misc. Super Poly	\N	\N	34	t
3149	Misc. La Mireya	\N	\N	34	t
3150	Ab. Nancy	\N	\N	34	t
3151	Misc. Samantha	\N	\N	34	t
3152	Misc. La Chapis	\N	\N	34	t
3153	Misc. Mi Tiendita Caro	\N	\N	34	t
3154	Misc. Los Arbolitos	\N	\N	34	t
3155	Misc. El Ovni	\N	\N	34	t
3156	Misc Hermanos	\N	\N	34	t
3157	El Jardin de los Canarios	\N	\N	34	t
3158	Misc. La pequeña	\N	\N	34	t
3159	Misc. El Ejidal	\N	\N	34	t
3160	Abarrotes Centavito 4	\N	\N	34	t
3161	Misc. El Trebol	\N	\N	34	t
3162	Misc Don Chuy	\N	\N	34	t
3163	Fruteria Mariana	\N	\N	34	t
3164	Misc. Blanca 2 Pisos	\N	\N	34	t
3165	Maria Griselda Torres Luna	\N	\N	34	t
3166	Misc. J R.	\N	\N	34	t
3167	Super M	\N	\N	34	t
3168	Misc. NaranjaAmarillo	\N	\N	34	t
3169	Misc. Melon Combinada	\N	\N	34	t
3170	Misc Max	\N	\N	34	t
3171	Abarrotes La Luna	\N	\N	34	t
3172	Misc y Papeleria Dulce	\N	\N	34	t
3173	Minisuper Poly	\N	\N	34	t
3174	Cuevas	\N	\N	34	t
3175	Fruteria 9 de Julio	\N	\N	34	t
3176	La Pradera	\N	\N	34	t
3177	Rosy	\N	\N	34	t
3178	Mary Fer	\N	\N	34	t
3179	JUAN ROBERTO OJEDA RUIZ	\N	\N	34	t
3180	Carniceria Marylu	\N	\N	34	t
3181	Gorditas Peque	\N	\N	34	t
3182	Msc La Sierra	\N	\N	34	t
3183	Misc de los Rios	\N	\N	34	t
3184	OSIRIS CABADA RIVAS	\N	\N	34	t
3185	Miscelanea Delia	\N	\N	34	t
3186	Fruteria y Cremeria Hannia	\N	\N	34	t
3187	Carniceria Mr Soria División del Norte	\N	\N	34	t
3188	Misc La Guera	\N	\N	34	t
3189	Miscelanea Ramos	\N	\N	35	t
3190	Mi Tiendita	\N	\N	35	t
3191	Alondra	\N	\N	35	t
3192	Misc Marlen	\N	\N	35	t
3193	Mini Super Mando	\N	\N	35	t
3194	Miscelanea El Chicharito	\N	\N	35	t
3195	Miscelanea Nataly	\N	\N	35	t
3196	Valentinos	\N	\N	35	t
3197	Alondra	\N	\N	35	t
3198	Carniceria Angus	\N	\N	35	t
3199	Misc Kai-Zen	\N	\N	35	t
3200	Rosario Lozano	\N	\N	35	t
3201	Miscelanea Cristy	\N	\N	35	t
3202	MARIA AURELIA MEDINA VAZQUEZ	\N	\N	35	t
3203	Mini Super Sedue	\N	\N	35	t
3204	Miscelanea Yolis	\N	\N	35	t
3205	ALEXIS RODRIGUEZ ORTIZ	\N	\N	35	t
3206	Miscelanea VDG	\N	\N	35	t
3207	IVAN TERRONES CARMONA	\N	\N	35	t
3208	Gorditas Kathis	\N	\N	35	t
3209	GUADALUPE CARMONA CABRALES	\N	\N	35	t
3210	Miscelanea Rosy	\N	\N	35	t
3211	Miscelanea Eli	\N	\N	35	t
3212	Abarrotes y Miscelanea Don Jose	\N	\N	35	t
3213	Miscelanea Dulce	\N	\N	35	t
3214	DIANA GRISELDA UNZUETA CASTRO	\N	\N	35	t
3215	Miscelanea Bailon	\N	\N	35	t
3216	Miscelanea La Esperanza	\N	\N	35	t
3217	Miscelanea Rosy	\N	\N	35	t
3218	Misc Ponce	\N	\N	35	t
3219	Miscelanea Vicky	\N	\N	35	t
3220	Miscelanea Pilis	\N	\N	35	t
3221	Miscelanea Lupita	\N	\N	35	t
3222	Miscelanea Martinez	\N	\N	35	t
3223	Miscelanea Tercia de Reyes	\N	\N	35	t
3224	Miscelanea La Casita de Chocolate	\N	\N	35	t
3225	Carniceria Universal	\N	\N	35	t
3226	Miscelanea Ramos	\N	\N	35	t
3227	Miscelanea La Pequeña	\N	\N	35	t
3228	Miscelanea Junior	\N	\N	35	t
3229	Fruteria Lucero	\N	\N	35	t
3230	Miscelanea Monte Carmelo	\N	\N	35	t
3231	Miscelanea Iker	\N	\N	35	t
3232	Miscelanea Miguel	\N	\N	35	t
3233	ANA MARIA TORRES TORRES	\N	\N	35	t
3234	Ab El Regio	\N	\N	35	t
3235	Toro Rey	\N	\N	35	t
3236	Misc Mayre	\N	\N	35	t
3237	Fruteria Keyly	\N	\N	35	t
3238	Misc Félix	\N	\N	35	t
3239	Misc Vanessa	\N	\N	35	t
3240	Misc Perlita	\N	\N	35	t
3241	Misc La Morena	\N	\N	35	t
3242	Fruteria  El Guero	\N	\N	35	t
3243	Misc Praderas	\N	\N	35	t
3244	Miscelanea Leo	\N	\N	35	t
3245	Miscelanea El JR	\N	\N	35	t
3246	Mini super la bonita	\N	\N	35	t
3247	Misc alondra	\N	\N	35	t
3248	Santa Elena	\N	\N	35	t
3249	Misc Terrie	\N	\N	35	t
3250	Mini Super La Loma	\N	\N	35	t
3251	Miscelanea Sandoval	\N	\N	35	t
3252	Misc Calixto	\N	\N	35	t
3253	Miscelanea Mi Tiendita	\N	\N	35	t
3254	Miscelanea Soto	\N	\N	35	t
3255	Miscelanea Sierra	\N	\N	35	t
3256	Miscelanea La Gaviota	\N	\N	35	t
3257	Miscelanea Mina	\N	\N	35	t
3258	Miscelanea El cacheton	\N	\N	35	t
3259	Miscelanea Flor Edith	\N	\N	35	t
3260	Productos Lacteos Yuya	\N	\N	35	t
3261	Carniceria Garcia	\N	\N	35	t
3262	Miscelánea Miguel	\N	\N	35	t
3263	Misc Don Flores	\N	\N	35	t
3264	Miscelanea Janeth	\N	\N	35	t
3265	Miscelanea Aylin	\N	\N	35	t
3266	LUIS ENRIQUE MATA MIER	\N	\N	35	t
3267	NANCY MARROQUIN HERNANDEZ	\N	\N	35	t
3268	Miscelanea Matias	\N	\N	35	t
3269	Miscelanea Faybi	\N	\N	35	t
3270	Carniceria La Purisima	\N	\N	35	t
3271	Miscelanea Lucy	\N	\N	35	t
3272	Miscelanea La Ventanita	\N	\N	35	t
3273	Miscelanea Emily	\N	\N	35	t
3274	Carniceria El Torito	\N	\N	35	t
3275	Misc Santy	\N	\N	35	t
3276	Gorditas La Nena	\N	\N	35	t
3277	Misc El Viajero	\N	\N	35	t
3278	Miscelanea Santa Elena V	\N	\N	35	t
3279	Misc Marlen	\N	\N	35	t
3280	Fruteria	\N	\N	35	t
3281	Miscelanea Nataly	\N	\N	35	t
3282	Carniceria Angus	\N	\N	35	t
3283	Misc. Lidia	\N	\N	35	t
3284	Rosario Lozano	\N	\N	35	t
3285	Musc. Jazmin	\N	\N	35	t
3286	Super IZA	\N	\N	35	t
3287	Abarrotes La Esquina	\N	\N	35	t
3288	Los Compadres	\N	\N	35	t
3289	Misc. Vecky	\N	\N	35	t
3290	Misc. Victoria	\N	\N	35	t
3291	Misc. Eva Maria	\N	\N	35	t
3292	Super Carniceria Los Sauces	\N	\N	35	t
3293	Misc Edith	\N	\N	35	t
3294	Miscelanea Eli	\N	\N	35	t
3295	Miscelanea Iker	\N	\N	35	t
3296	Miscelanea Miguel	\N	\N	35	t
3297	Ab El Regio	\N	\N	35	t
3298	Tortilleria Mariana	\N	\N	35	t
3299	Abarrotes Chayito	\N	\N	35	t
3300	Misc Alexia	\N	\N	35	t
3301	Misc El 109	\N	\N	35	t
3302	Mis Mary-Mart	\N	\N	35	t
3303	Mini Super Julios	\N	\N	35	t
3304	Menudería Doña Yola	\N	\N	35	t
3305	Misc. Gil	\N	\N	35	t
3306	Misc. Junior	\N	\N	35	t
3307	Tayoltita	\N	\N	35	t
3308	Misc. Morelos	\N	\N	35	t
3309	Misc. Cristy	\N	\N	35	t
3310	Misc. La Flor De Michoacan	\N	\N	35	t
3311	Misc. Rickys	\N	\N	35	t
3312	Misc. La Escondida	\N	\N	35	t
3313	Fruteria La Manzanita	\N	\N	35	t
3314	Misc. Lidia	\N	\N	35	t
3315	Misc. Eva Maria	\N	\N	35	t
3316	Misc Tita	\N	\N	35	t
3317	Tortilleria Mariana	\N	\N	35	t
\.


--
-- TOC entry 4457 (class 0 OID 16625)
-- Dependencies: 238
-- Data for Name: discount_rules; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.discount_rules (id, cliente_id, producto_id, tipo_descuento, activo, fecha_creacion) FROM stdin;
\.


--
-- TOC entry 4459 (class 0 OID 16645)
-- Dependencies: 240
-- Data for Name: discount_tiers; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.discount_tiers (id, rule_id, volumen_desde, descuento_monto) FROM stdin;
\.


--
-- TOC entry 4447 (class 0 OID 16511)
-- Dependencies: 228
-- Data for Name: inventario_bodega; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.inventario_bodega (id, producto_id, cantidad, ultima_actualizacion) FROM stdin;
\.


--
-- TOC entry 4445 (class 0 OID 16492)
-- Dependencies: 226
-- Data for Name: inventario_ruta; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.inventario_ruta (id, ruta_id, producto_id, cantidad, ultima_actualizacion) FROM stdin;
\.


--
-- TOC entry 4449 (class 0 OID 16527)
-- Dependencies: 230
-- Data for Name: movimientos_stock; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.movimientos_stock (id, tipo, producto_id, cantidad, ruta_id, usuario_id, notas, fecha) FROM stdin;
\.


--
-- TOC entry 4443 (class 0 OID 16484)
-- Dependencies: 224
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.productos (id, nombre, precio, unidad, activo) FROM stdin;
1	Queso	141.00	kg	t
\.


--
-- TOC entry 4437 (class 0 OID 16440)
-- Dependencies: 218
-- Data for Name: rutas; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.rutas (id, nombre, descripcion, activa) FROM stdin;
1	Ruta 1	R1	t
2	Ruta 2	R2	t
3	Ruta 3	R3	t
4	Ruta 4	R4	t
5	Ruta 5	R5	t
6	Ruta 6	R6	t
7	Ruta 7	R7	t
8	Ruta 8	R8	t
9	Ruta 9	R9	t
10	Ruta 10	R10	t
11	Ruta 11	R11	t
12	Ruta 12	R12	t
13	Ruta 13	R13	t
14	Ruta 14	R14	t
15	Ruta 15	R15	t
16	Ruta 16	R16	t
17	Ruta 17	R17	t
18	Ruta 18	R18	t
19	Ruta 19	R19	t
20	Ruta 20	R20	t
21	Ruta 21	R21	t
22	Ruta 22	R22	t
23	Ruta 23	R23	t
24	Ruta 24	R24	t
25	Ruta 25	R25	t
26	Ruta 26	R26	t
27	Ruta 27	R27	t
28	Ruta 28	R28	t
29	Ruta 29	R29	t
30	Ruta 30	R30	t
31	Ruta 31	R31	t
32	Ruta 32	R32	t
33	Ruta 33	R33	t
34	Ruta 34	R34	t
35	Ruta 35	R35	t
\.


--
-- TOC entry 4455 (class 0 OID 16605)
-- Dependencies: 236
-- Data for Name: sync_events; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.sync_events (id, event_id, usuario_id, tipo, payload, procesado, fecha_recepcion, fecha_procesamiento, error) FROM stdin;
\.


--
-- TOC entry 4439 (class 0 OID 16450)
-- Dependencies: 220
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.usuarios (id, username, password, nombre, rol, ruta_id, activo) FROM stdin;
1	R1	$2b$10$w0x30mOmthuqBPqlZuoBpuZlrMuHh5RNWJBE9Hhn5qYDWDr4Mg7l6	Juan	vendedor	1	t
2	R2	$2b$10$z4xeHXKEQkd50Ept6s5pXOmVknBd.BPkcw1/VDIu9ewDIQRjbBavO	Juan	vendedor	2	t
3	R3	$2b$10$def7qSefuKYe7xfEv9DIyeBGDyaf9p3sVRuddRS9YLDuP0mCDIcna	Juan	vendedor	3	t
4	R4	$2b$10$pkAqcvLRSte6Ldkpas3qLO81Qxyz0v6C9wOIp9kx8ABD3kNiyKLa6	Juan	vendedor	4	t
5	R5	$2b$10$gjglFlGgRHB6n5FZYVktMeTLRjiF7UkOT6bCBKC0uUU1bQWCIfVTa	Juan	vendedor	5	t
6	R6	$2b$10$u9iOl1RtssRyds27rozNfOD7DkqMJWjAeBsyxrKaRWIWkDvARi43W	Juan	vendedor	6	t
7	R7	$2b$10$eOzpKkTw.gVWf2vmrK5AaOV3eBtIQqZ6aacyZtCm5kXq6cDMe.j7u	Juan	vendedor	7	t
8	R8	$2b$10$KEMk1tifBIgygB/yZwVTH.ZWzlsC2CPkXqNO3mx.Mb/1nwdyQJ3.q	Juan	vendedor	8	t
9	R9	$2b$10$BXS/hIeRjUi8QbD88K.5m.olmuL/mIatLQWRfwM8dt.9eRCrDjc7K	Juan	vendedor	9	t
10	R10	$2b$10$wCjUBDjSfuBVKu.QIqdVHOQU2aQ/w1lgULf8URrUo75DxLQaPh82a	Juan	vendedor	10	t
11	R11	$2b$10$wUdq6jDLcEWx6qo87jpVYuu1YNl4gh2vEEg/OulITm5Vp7qV4GRka	Juan	vendedor	11	t
12	R12	$2b$10$PV2EYE46FmKKb8b2BYR.DegdoCEUKevwWyVGN4Iy4PFXpHQLhTLZ6	Juan	vendedor	12	t
13	R13	$2b$10$ANlCBjohpEFF/n2N1Rewxer4FUFd2QyEd0d.58NCAZJ88keaS1S2W	Juan	vendedor	13	t
14	R14	$2b$10$xi9umtvuNR1THaFgHOa2dOumzcHu7dWjPa2Z67cS6u8rGn/iqxmvq	Juan	vendedor	14	t
15	R15	$2b$10$rTnqcOWOhz.Ld1L7cc0OMuem5YPYZBLXpHhPMJJr..AE.rFInqAKu	Juan	vendedor	15	t
16	R16	$2b$10$WrBewdtFFqhYwGULLS2gb.jS.v2yB9oGikI.iqHmmbfUT6ejmF2ZC	Juan	vendedor	16	t
17	R17	$2b$10$orRCsWCAEmqU7sqCYYT1t.6/mIB22.b5jxVPBWqpAxY.a916/2fw6	Juan	vendedor	17	t
18	R18	$2b$10$j0VWrfdaXXbta8FHIiRuZ.zQlJpM6jreezYgQp4UyhvqMx5jc06DW	Juan	vendedor	18	t
19	R19	$2b$10$euDVj9OJnRvwkgdGm86y9OMM/lYyYzG0G7/Qetb14Lg4Aa6Cr2lnC	Juan	vendedor	19	t
20	R20	$2b$10$v1NpYKUIpni763SwKpUWUexoV5OF.mU9bHJeXBl.5hi4oSHVX3gjS	Juan	vendedor	20	t
21	R21	$2b$10$slMPMyv.TB6y6.IhYQZmBOsG7fk.GvQK07uvs0AhHFwrGuv9P4rsy	Juan	vendedor	21	t
22	R22	$2b$10$miem17G.Jobpt9iJkJcHpeswpDngF4CC8oOolYgTah4V0tuHaRAJa	Juan	vendedor	22	t
23	R23	$2b$10$1hnWx/4mmL3lQahdByFAKuUgVuXMSUeYPGxpm2hBJF.ykXdjI6F42	Juan	vendedor	23	t
24	R24	$2b$10$5muByhLf8h.Ym8QC3/j60OtE7Ik9aq7w77baHkXZlMHLnjRVUHtYO	Juan	vendedor	24	t
25	R25	$2b$10$6vF18nF7OjoUuM91LzrrZOV.Yrd3PryBtepMLaQFoDUrgGsBraqgW	Juan	vendedor	25	t
26	R26	$2b$10$n62yebPyAlx1gNnt9/mfV.NigFnC6WwA7dsfHJpgIhMlwe6pKWByO	Juan	vendedor	26	t
27	R27	$2b$10$gHlRcIdtBTr9uTAB1zfrqOCQcmFhd9UXEWmRPxC6S/0cBmUYkLQfm	Juan	vendedor	27	t
28	R28	$2b$10$mUbs7lWR6HWT0BrkebIa9uxyhi4jhiyX/K9fgFBhQ77sENfl.DS2m	Juan	vendedor	28	t
29	R29	$2b$10$RKT0eQn4I3q.oiNlSIcKouJdi1rEG7.qa.LU4VwGdrNwSr3JBmCwO	Juan	vendedor	29	t
30	R30	$2b$10$ezHoSmxuYK0nzCjn8kCA9u42KUDazpjWcD0YDYVLZVnIQE/U55kfG	Juan	vendedor	30	t
31	R31	$2b$10$sp14lOs9NAVLXgzj/c/pSu5sBpRL3gt4CX97QfprqW5ZtdMiRZNYO	Juan	vendedor	31	t
32	R32	$2b$10$S7.YZTfJ1Z5PoYwJb5assexrhEPAG1IxalUVWpTaXeIwKJu2KpOXm	Juan	vendedor	32	t
33	R33	$2b$10$tNqZRrLS2OpPum9yoT4BB.3PDj3Tx1h58zgyHGN6euAW58BMSYJHC	Juan	vendedor	33	t
34	R34	$2b$10$7QjrEbOyPkhOyW/ezW8QH.pr2UbqSXBCapJTBrvLuOkkaL8yi5Fxq	Juan	vendedor	34	t
35	R35	$2b$10$FWfYVNOcNXoySQDh1OXcu.dqupBqmj5qB8cXSbkzsxLnEpULPqrzO	Juan	vendedor	35	t
\.


--
-- TOC entry 4453 (class 0 OID 16587)
-- Dependencies: 234
-- Data for Name: venta_items; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.venta_items (id, venta_id, producto_id, cantidad, precio_unitario, subtotal) FROM stdin;
\.


--
-- TOC entry 4451 (class 0 OID 16555)
-- Dependencies: 232
-- Data for Name: ventas; Type: TABLE DATA; Schema: public; Owner: dbmasteruser
--

COPY public.ventas (id, cliente_tx_id, usuario_id, cliente_id, ruta_id, fecha_venta, fecha_sync, subtotal, descuento, total, descuento_aplicado) FROM stdin;
\.


--
-- TOC entry 4477 (class 0 OID 0)
-- Dependencies: 221
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.clientes_id_seq', 3317, true);


--
-- TOC entry 4478 (class 0 OID 0)
-- Dependencies: 237
-- Name: discount_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.discount_rules_id_seq', 1, false);


--
-- TOC entry 4479 (class 0 OID 0)
-- Dependencies: 239
-- Name: discount_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.discount_tiers_id_seq', 1, false);


--
-- TOC entry 4480 (class 0 OID 0)
-- Dependencies: 227
-- Name: inventario_bodega_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.inventario_bodega_id_seq', 1, false);


--
-- TOC entry 4481 (class 0 OID 0)
-- Dependencies: 225
-- Name: inventario_ruta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.inventario_ruta_id_seq', 1, false);


--
-- TOC entry 4482 (class 0 OID 0)
-- Dependencies: 229
-- Name: movimientos_stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.movimientos_stock_id_seq', 1, false);


--
-- TOC entry 4483 (class 0 OID 0)
-- Dependencies: 223
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.productos_id_seq', 1, true);


--
-- TOC entry 4484 (class 0 OID 0)
-- Dependencies: 217
-- Name: rutas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.rutas_id_seq', 35, true);


--
-- TOC entry 4485 (class 0 OID 0)
-- Dependencies: 235
-- Name: sync_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.sync_events_id_seq', 1, false);


--
-- TOC entry 4486 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 35, true);


--
-- TOC entry 4487 (class 0 OID 0)
-- Dependencies: 233
-- Name: venta_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.venta_items_id_seq', 1, false);


--
-- TOC entry 4488 (class 0 OID 0)
-- Dependencies: 231
-- Name: ventas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbmasteruser
--

SELECT pg_catalog.setval('public.ventas_id_seq', 1, false);


--
-- TOC entry 4236 (class 2606 OID 16477)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 4270 (class 2606 OID 16632)
-- Name: discount_rules discount_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.discount_rules
    ADD CONSTRAINT discount_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 4272 (class 2606 OID 16650)
-- Name: discount_tiers discount_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.discount_tiers
    ADD CONSTRAINT discount_tiers_pkey PRIMARY KEY (id);


--
-- TOC entry 4243 (class 2606 OID 16517)
-- Name: inventario_bodega inventario_bodega_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.inventario_bodega
    ADD CONSTRAINT inventario_bodega_pkey PRIMARY KEY (id);


--
-- TOC entry 4245 (class 2606 OID 16519)
-- Name: inventario_bodega inventario_bodega_producto_id_key; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.inventario_bodega
    ADD CONSTRAINT inventario_bodega_producto_id_key UNIQUE (producto_id);


--
-- TOC entry 4240 (class 2606 OID 16498)
-- Name: inventario_ruta inventario_ruta_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.inventario_ruta
    ADD CONSTRAINT inventario_ruta_pkey PRIMARY KEY (id);


--
-- TOC entry 4249 (class 2606 OID 16535)
-- Name: movimientos_stock movimientos_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.movimientos_stock
    ADD CONSTRAINT movimientos_stock_pkey PRIMARY KEY (id);


--
-- TOC entry 4238 (class 2606 OID 16490)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 4228 (class 2606 OID 16448)
-- Name: rutas rutas_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.rutas
    ADD CONSTRAINT rutas_pkey PRIMARY KEY (id);


--
-- TOC entry 4264 (class 2606 OID 16616)
-- Name: sync_events sync_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.sync_events
    ADD CONSTRAINT sync_events_event_id_key UNIQUE (event_id);


--
-- TOC entry 4266 (class 2606 OID 16614)
-- Name: sync_events sync_events_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.sync_events
    ADD CONSTRAINT sync_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4230 (class 2606 OID 16458)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4234 (class 2606 OID 16460)
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- TOC entry 4260 (class 2606 OID 16592)
-- Name: venta_items venta_items_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.venta_items
    ADD CONSTRAINT venta_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4254 (class 2606 OID 16566)
-- Name: ventas ventas_cliente_tx_id_key; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_cliente_tx_id_key UNIQUE (cliente_tx_id);


--
-- TOC entry 4257 (class 2606 OID 16564)
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- TOC entry 4268 (class 1259 OID 16643)
-- Name: discount_rules_cliente_producto_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX discount_rules_cliente_producto_idx ON public.discount_rules USING btree (cliente_id, producto_id);


--
-- TOC entry 4273 (class 1259 OID 16656)
-- Name: discount_tiers_rule_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX discount_tiers_rule_idx ON public.discount_tiers USING btree (rule_id);


--
-- TOC entry 4246 (class 1259 OID 16525)
-- Name: inventario_bodega_producto_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX inventario_bodega_producto_idx ON public.inventario_bodega USING btree (producto_id);


--
-- TOC entry 4241 (class 1259 OID 16509)
-- Name: inventario_ruta_ruta_producto_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX inventario_ruta_ruta_producto_idx ON public.inventario_ruta USING btree (ruta_id, producto_id);


--
-- TOC entry 4247 (class 1259 OID 16552)
-- Name: movimientos_stock_fecha_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX movimientos_stock_fecha_idx ON public.movimientos_stock USING btree (fecha);


--
-- TOC entry 4250 (class 1259 OID 16553)
-- Name: movimientos_stock_producto_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX movimientos_stock_producto_idx ON public.movimientos_stock USING btree (producto_id);


--
-- TOC entry 4262 (class 1259 OID 16622)
-- Name: sync_events_event_id_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX sync_events_event_id_idx ON public.sync_events USING btree (event_id);


--
-- TOC entry 4267 (class 1259 OID 16623)
-- Name: sync_events_procesado_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX sync_events_procesado_idx ON public.sync_events USING btree (procesado);


--
-- TOC entry 4231 (class 1259 OID 16467)
-- Name: usuarios_ruta_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX usuarios_ruta_idx ON public.usuarios USING btree (ruta_id);


--
-- TOC entry 4232 (class 1259 OID 16466)
-- Name: usuarios_username_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX usuarios_username_idx ON public.usuarios USING btree (username);


--
-- TOC entry 4261 (class 1259 OID 16603)
-- Name: venta_items_venta_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX venta_items_venta_idx ON public.venta_items USING btree (venta_id);


--
-- TOC entry 4251 (class 1259 OID 16584)
-- Name: ventas_cliente_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX ventas_cliente_idx ON public.ventas USING btree (cliente_id);


--
-- TOC entry 4252 (class 1259 OID 16582)
-- Name: ventas_cliente_tx_id_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX ventas_cliente_tx_id_idx ON public.ventas USING btree (cliente_tx_id);


--
-- TOC entry 4255 (class 1259 OID 16585)
-- Name: ventas_fecha_venta_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX ventas_fecha_venta_idx ON public.ventas USING btree (fecha_venta);


--
-- TOC entry 4258 (class 1259 OID 16583)
-- Name: ventas_ruta_idx; Type: INDEX; Schema: public; Owner: dbmasteruser
--

CREATE INDEX ventas_ruta_idx ON public.ventas USING btree (ruta_id);


--
-- TOC entry 4275 (class 2606 OID 16478)
-- Name: clientes clientes_ruta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id);


--
-- TOC entry 4288 (class 2606 OID 16633)
-- Name: discount_rules discount_rules_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.discount_rules
    ADD CONSTRAINT discount_rules_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- TOC entry 4289 (class 2606 OID 16638)
-- Name: discount_rules discount_rules_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.discount_rules
    ADD CONSTRAINT discount_rules_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4290 (class 2606 OID 16651)
-- Name: discount_tiers discount_tiers_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.discount_tiers
    ADD CONSTRAINT discount_tiers_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.discount_rules(id);


--
-- TOC entry 4278 (class 2606 OID 16520)
-- Name: inventario_bodega inventario_bodega_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.inventario_bodega
    ADD CONSTRAINT inventario_bodega_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4276 (class 2606 OID 16504)
-- Name: inventario_ruta inventario_ruta_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.inventario_ruta
    ADD CONSTRAINT inventario_ruta_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4277 (class 2606 OID 16499)
-- Name: inventario_ruta inventario_ruta_ruta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.inventario_ruta
    ADD CONSTRAINT inventario_ruta_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id);


--
-- TOC entry 4279 (class 2606 OID 16536)
-- Name: movimientos_stock movimientos_stock_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.movimientos_stock
    ADD CONSTRAINT movimientos_stock_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4280 (class 2606 OID 16541)
-- Name: movimientos_stock movimientos_stock_ruta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.movimientos_stock
    ADD CONSTRAINT movimientos_stock_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id);


--
-- TOC entry 4281 (class 2606 OID 16546)
-- Name: movimientos_stock movimientos_stock_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.movimientos_stock
    ADD CONSTRAINT movimientos_stock_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4287 (class 2606 OID 16617)
-- Name: sync_events sync_events_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.sync_events
    ADD CONSTRAINT sync_events_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4274 (class 2606 OID 16461)
-- Name: usuarios usuarios_ruta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id);


--
-- TOC entry 4285 (class 2606 OID 16598)
-- Name: venta_items venta_items_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.venta_items
    ADD CONSTRAINT venta_items_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4286 (class 2606 OID 16593)
-- Name: venta_items venta_items_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.venta_items
    ADD CONSTRAINT venta_items_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id);


--
-- TOC entry 4282 (class 2606 OID 16572)
-- Name: ventas ventas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- TOC entry 4283 (class 2606 OID 16577)
-- Name: ventas ventas_ruta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id);


--
-- TOC entry 4284 (class 2606 OID 16567)
-- Name: ventas ventas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dbmasteruser
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


-- Completed on 2026-02-02 15:55:41

--
-- PostgreSQL database dump complete
--

\unrestrict yIvhWaKDR5g96F4MZu7bqIWxvCHwXKOOuOEGj0JZ1WUmz0Da2DqNFfJgnJkStXj

