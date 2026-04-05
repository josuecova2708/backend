"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFakerService = void 0;
const common_1 = require("@nestjs/common");
const faker_1 = require("@faker-js/faker");
let DataFakerService = class DataFakerService {
    generate(tables, rowCount) {
        const generatedIds = {};
        const results = [];
        for (const table of tables) {
            const columns = table.columns.map((c) => c.name);
            const rows = [];
            const uniqueSets = {};
            let pkCounter = 1;
            const domain = this.detectTableDomain(table.name);
            for (const col of table.columns) {
                if (col.isUnique) {
                    uniqueSets[col.name] = new Set();
                }
            }
            generatedIds[table.name] = [];
            for (let i = 0; i < rowCount; i++) {
                const row = [];
                for (const col of table.columns) {
                    let value;
                    if (col.isForeignKey && col.foreignKey) {
                        if (col.isSelfReference) {
                            if (i === 0) {
                                value = null;
                            }
                            else {
                                const available = generatedIds[table.name].slice(0, i);
                                value =
                                    available[Math.floor(Math.random() * available.length)];
                            }
                        }
                        else {
                            const parentIds = generatedIds[col.foreignKey.table];
                            if (parentIds && parentIds.length > 0) {
                                if (col.isNullable && Math.random() < 0.2) {
                                    value = null;
                                }
                                else {
                                    value =
                                        parentIds[Math.floor(Math.random() * parentIds.length)];
                                }
                            }
                            else {
                                value = null;
                            }
                        }
                    }
                    else if (col.isPrimaryKey) {
                        value = this.generatePrimaryKey(col, pkCounter);
                        pkCounter++;
                    }
                    else if (col.isNullable && !col.isUnique && Math.random() < 0.2) {
                        value = null;
                    }
                    else {
                        value = this.generateValue(col, domain);
                    }
                    if (col.isUnique && value !== null && uniqueSets[col.name]) {
                        value = this.ensureUnique(() => col.isPrimaryKey
                            ? this.generatePrimaryKey(col, pkCounter++)
                            : this.generateValue(col, domain), uniqueSets[col.name], value);
                    }
                    row.push(value);
                }
                const pkCol = table.columns.find((c) => c.isPrimaryKey);
                if (pkCol) {
                    const pkIndex = table.columns.indexOf(pkCol);
                    generatedIds[table.name].push(row[pkIndex]);
                }
                rows.push(row);
            }
            results.push({ table: table.name, columns, rows });
        }
        return results;
    }
    detectTableDomain(tableName) {
        const lower = tableName.toLowerCase();
        const domainPatterns = [
            [
                [
                    'user', 'usuario', 'empleado', 'employee', 'persona',
                    'person', 'customer', 'cliente', 'staff', 'member',
                    'miembro', 'contact', 'contacto', 'author', 'autor',
                    'student', 'estudiante', 'teacher', 'profesor', 'doctor',
                    'patient', 'paciente', 'driver', 'conductor',
                ],
                'person',
            ],
            [
                [
                    'product', 'producto', 'articulo', 'article', 'item',
                    'merchandise', 'good', 'service', 'servicio', 'menu_item',
                    'dish', 'plato', 'book', 'libro', 'course', 'curso',
                    'vehicle', 'vehiculo', 'property', 'propiedad',
                ],
                'product',
            ],
            [
                [
                    'categori', 'category', 'department', 'departamento',
                    'section', 'seccion', 'genre', 'genero', 'type', 'tipo',
                    'tag', 'etiqueta', 'topic', 'tema', 'brand', 'marca',
                ],
                'category',
            ],
            [
                [
                    'order', 'pedido', 'purchase', 'compra', 'sale', 'venta',
                    'invoice', 'factura', 'transaction', 'transaccion',
                    'payment', 'pago', 'cart', 'carrito', 'booking', 'reserva',
                ],
                'order',
            ],
            [
                [
                    'company', 'empresa', 'organization', 'organizacion',
                    'business', 'negocio', 'store', 'tienda', 'shop',
                    'branch', 'sucursal', 'supplier', 'proveedor', 'vendor',
                ],
                'company',
            ],
            [
                [
                    'location', 'ubicacion', 'address', 'direccion', 'city',
                    'ciudad', 'country', 'pais', 'region', 'state', 'estado',
                    'warehouse', 'almacen', 'office', 'oficina',
                ],
                'location',
            ],
        ];
        for (const [keywords, domain] of domainPatterns) {
            if (keywords.some((kw) => lower.includes(kw))) {
                return domain;
            }
        }
        return 'generic';
    }
    generatePrimaryKey(col, counter) {
        if (col.dataType === 'UUID') {
            return faker_1.faker.string.uuid();
        }
        return counter;
    }
    generateValue(col, domain) {
        const contextual = this.matchByContext(col.name, domain);
        if (contextual !== undefined) {
            return this.applyMaxLength(contextual, col.maxLength);
        }
        const semantic = this.matchByName(col.name);
        if (semantic !== undefined) {
            return this.applyMaxLength(semantic, col.maxLength);
        }
        const byType = this.matchByType(col.dataType, col.maxLength);
        if (byType !== undefined) {
            return byType;
        }
        return this.applyMaxLength(faker_1.faker.lorem.word(), col.maxLength);
    }
    matchByContext(columnName, domain) {
        const lower = columnName.toLowerCase();
        if (this.isMatch(lower, ['name', 'nombre']) &&
            !/(first_?name|last_?name|full_?name|nombre_completo|primer_nombre|apellido)/i.test(lower)) {
            return this.generateNameByDomain(domain);
        }
        if (this.isMatch(lower, ['description', 'descripcion'])) {
            return this.generateDescriptionByDomain(domain);
        }
        if (this.isMatch(lower, ['title', 'titulo'])) {
            return this.generateTitleByDomain(domain);
        }
        if (this.isMatch(lower, ['status', 'estado'])) {
            return this.generateStatusByDomain(domain);
        }
        return undefined;
    }
    generateNameByDomain(domain) {
        switch (domain) {
            case 'person':
                return faker_1.faker.person.fullName();
            case 'product':
                return faker_1.faker.commerce.productName();
            case 'category':
                return faker_1.faker.commerce.department();
            case 'company':
                return faker_1.faker.company.name();
            case 'location':
                return faker_1.faker.location.city();
            case 'order':
                return `ORD-${faker_1.faker.string.alphanumeric(8).toUpperCase()}`;
            default:
                return faker_1.faker.commerce.productName();
        }
    }
    generateDescriptionByDomain(domain) {
        switch (domain) {
            case 'product':
                return faker_1.faker.commerce.productDescription();
            case 'category':
                return `${faker_1.faker.commerce.department()} products and accessories`;
            case 'company':
                return faker_1.faker.company.catchPhrase();
            case 'person':
                return faker_1.faker.person.bio();
            default:
                return faker_1.faker.lorem.sentence();
        }
    }
    generateTitleByDomain(domain) {
        switch (domain) {
            case 'person':
                return faker_1.faker.person.jobTitle();
            case 'product':
                return faker_1.faker.commerce.productName();
            case 'company':
                return faker_1.faker.person.jobTitle();
            default:
                return faker_1.faker.company.catchPhrase();
        }
    }
    generateStatusByDomain(domain) {
        switch (domain) {
            case 'order':
                return faker_1.faker.helpers.arrayElement([
                    'pending',
                    'processing',
                    'shipped',
                    'delivered',
                    'cancelled',
                ]);
            case 'person':
                return faker_1.faker.helpers.arrayElement(['active', 'inactive', 'suspended']);
            case 'product':
                return faker_1.faker.helpers.arrayElement([
                    'available',
                    'out_of_stock',
                    'discontinued',
                ]);
            default:
                return faker_1.faker.helpers.arrayElement(['active', 'inactive', 'pending']);
        }
    }
    matchByName(name) {
        const rules = [
            [/full_?name|nombre_completo|complete_name/i, () => faker_1.faker.person.fullName()],
            [/first_?name|primer_nombre/i, () => faker_1.faker.person.firstName()],
            [/last_?name|apellido|surname/i, () => faker_1.faker.person.lastName()],
            [/\bage\b|\bedad\b/i, () => faker_1.faker.number.int({ min: 18, max: 80 })],
            [/birth|nacimiento/i, () => faker_1.faker.date.birthdate().toISOString().split('T')[0]],
            [/email|correo/i, () => faker_1.faker.internet.email()],
            [/phone|telefono|celular|mobile/i, () => faker_1.faker.phone.number()],
            [/username|user_name|login/i, () => faker_1.faker.internet.username()],
            [/password|contrase.a|passwd/i, () => faker_1.faker.internet.password()],
            [/avatar|profile_image|foto_perfil/i, () => faker_1.faker.image.url()],
            [/ip_address|ip_addr/i, () => faker_1.faker.internet.ipv4()],
            [/location|address|direccion|street|calle/i, () => faker_1.faker.location.streetAddress()],
            [/city|ciudad/i, () => faker_1.faker.location.city()],
            [/country|pais/i, () => faker_1.faker.location.country()],
            [/zip|postal|codigo_postal/i, () => faker_1.faker.location.zipCode()],
            [/state|provincia|region/i, () => faker_1.faker.location.state()],
            [/company|empresa/i, () => faker_1.faker.company.name()],
            [/department|departamento/i, () => faker_1.faker.commerce.department()],
            [/role|rol|job_title|puesto|cargo|position|assigned_role/i, () => faker_1.faker.person.jobTitle()],
            [/\bprice\b|precio|unit_price|precio_unitario/i, () => faker_1.faker.commerce.price({ min: 5, max: 999 })],
            [/total|subtotal|\bamount\b|monto|importe/i, () => faker_1.faker.commerce.price({ min: 10, max: 5000 })],
            [/budget|presupuesto/i, () => faker_1.faker.finance.amount({ min: 1000, max: 100000, dec: 2 })],
            [/account|cuenta/i, () => faker_1.faker.finance.accountNumber()],
            [/salary|salario|sueldo/i, () => faker_1.faker.finance.amount({ min: 2000, max: 15000, dec: 2 })],
            [/quantity|cantidad|\bqty\b|stock|units|unidades/i, () => faker_1.faker.number.int({ min: 1, max: 20 })],
            [/rating|calificacion|score|puntaje/i, () => faker_1.faker.number.float({ min: 1, max: 5, fractionDigits: 1 })],
            [/percentage|porcentaje|percent/i, () => faker_1.faker.number.float({ min: 0, max: 100, fractionDigits: 2 })],
            [/weight|peso/i, () => faker_1.faker.number.float({ min: 0.1, max: 100, fractionDigits: 2 })],
            [/end_date|due_date|fecha_fin|fecha_vencimiento|expires/i, () => faker_1.faker.date.future().toISOString().split('T')[0]],
            [/start_date|hire_date|fecha_inicio|fecha_registro|fecha_pedido|created_at|updated_at|deleted_at/i,
                () => faker_1.faker.date.past().toISOString().split('T')[0]],
            [/\bdate\b|\bfecha\b/i, () => faker_1.faker.date.past().toISOString().split('T')[0]],
            [/url|website|link|webpage/i, () => faker_1.faker.internet.url()],
            [/image|imagen|photo|foto/i, () => faker_1.faker.image.url()],
            [/color|colour/i, () => faker_1.faker.color.human()],
            [/comment|comentario|note|nota|review|rese.a|feedback/i, () => faker_1.faker.lorem.sentences(2)],
            [/\bbio\b|about|acerca/i, () => faker_1.faker.person.bio()],
            [/\buuid\b|\bguid\b/i, () => faker_1.faker.string.uuid()],
            [/\bcode\b|\bcodigo\b|\bsku\b|reference|referencia/i, () => faker_1.faker.string.alphanumeric(8).toUpperCase()],
            [/^is_|^has_|^can_/i, () => faker_1.faker.datatype.boolean()],
        ];
        for (const [pattern, generator] of rules) {
            if (pattern.test(name)) {
                return generator();
            }
        }
        return undefined;
    }
    matchByType(dataType, maxLength) {
        switch (dataType) {
            case 'VARCHAR':
            case 'CHAR':
                return this.applyMaxLength(faker_1.faker.lorem.words(3), maxLength);
            case 'TEXT':
                return faker_1.faker.lorem.words(3);
            case 'INTEGER':
            case 'BIGINT':
            case 'SMALLINT':
                return faker_1.faker.number.int({ min: 1, max: 9999 });
            case 'SERIAL':
            case 'BIGSERIAL':
                return faker_1.faker.number.int({ min: 1, max: 9999 });
            case 'DECIMAL':
            case 'NUMERIC':
            case 'FLOAT':
            case 'REAL':
            case 'DOUBLE PRECISION':
                return faker_1.faker.number.float({ min: 0, max: 9999, fractionDigits: 2 });
            case 'BOOLEAN':
                return faker_1.faker.datatype.boolean();
            case 'DATE':
                return faker_1.faker.date.past().toISOString().split('T')[0];
            case 'TIMESTAMP':
            case 'TIMESTAMPTZ':
                return faker_1.faker.date.past().toISOString();
            case 'UUID':
                return faker_1.faker.string.uuid();
            case 'JSON':
            case 'JSONB':
                return '{}';
            default:
                return undefined;
        }
    }
    isMatch(columnName, keywords) {
        return keywords.some((kw) => columnName === kw ||
            columnName.endsWith(`_${kw}`) ||
            columnName.startsWith(`${kw}_`));
    }
    applyMaxLength(value, maxLength) {
        if (maxLength && typeof value === 'string' && value.length > maxLength) {
            return value.substring(0, maxLength);
        }
        return value;
    }
    ensureUnique(generator, existingValues, initialValue) {
        if (!existingValues.has(initialValue)) {
            existingValues.add(initialValue);
            return initialValue;
        }
        for (let i = 0; i < 100; i++) {
            const value = generator();
            if (!existingValues.has(value)) {
                existingValues.add(value);
                return value;
            }
        }
        const fallback = typeof initialValue === 'string'
            ? `${initialValue}_${existingValues.size}`
            : initialValue + existingValues.size;
        existingValues.add(fallback);
        return fallback;
    }
};
exports.DataFakerService = DataFakerService;
exports.DataFakerService = DataFakerService = __decorate([
    (0, common_1.Injectable)()
], DataFakerService);
//# sourceMappingURL=data-faker.service.js.map