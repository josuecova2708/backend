import { Injectable } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { TableInfo, ColumnInfo, GeneratedData } from './interfaces';

/**
 * Table domain types inferred from table names.
 * Used to resolve ambiguous column names like "nombre" / "name".
 */
type TableDomain =
  | 'person'
  | 'product'
  | 'category'
  | 'order'
  | 'company'
  | 'location'
  | 'generic';

@Injectable()
export class DataFakerService {
  /**
   * Phase 3: Generate synthetic data for all tables in topological order.
   * Uses a cascade: FK → table-context name → generic name → SQL type → fallback.
   */
  generate(tables: TableInfo[], rowCount: number): GeneratedData[] {
    const generatedIds: Record<string, any[]> = {};
    const results: GeneratedData[] = [];

    for (const table of tables) {
      const columns = table.columns.map((c) => c.name);
      const rows: any[][] = [];
      const uniqueSets: Record<string, Set<any>> = {};
      let pkCounter = 1;

      // Detect table domain for context-aware generation
      const domain = this.detectTableDomain(table.name);

      for (const col of table.columns) {
        if (col.isUnique) {
          uniqueSets[col.name] = new Set();
        }
      }

      generatedIds[table.name] = [];

      for (let i = 0; i < rowCount; i++) {
        const row: any[] = [];

        for (const col of table.columns) {
          let value: any;

          // === Step 0: FK resolution (highest priority) ===
          if (col.isForeignKey && col.foreignKey) {
            if (col.isSelfReference) {
              if (i === 0) {
                value = null;
              } else {
                const available = generatedIds[table.name].slice(0, i);
                value =
                  available[Math.floor(Math.random() * available.length)];
              }
            } else {
              const parentIds = generatedIds[col.foreignKey.table];
              if (parentIds && parentIds.length > 0) {
                if (col.isNullable && Math.random() < 0.2) {
                  value = null;
                } else {
                  value =
                    parentIds[Math.floor(Math.random() * parentIds.length)];
                }
              } else {
                value = null;
              }
            }
          }
          // === Step PK: Primary Key generation ===
          else if (col.isPrimaryKey) {
            value = this.generatePrimaryKey(col, pkCounter);
            pkCounter++;
          }
          // === Step nullable check ===
          else if (col.isNullable && !col.isUnique && Math.random() < 0.2) {
            value = null;
          }
          // === Steps 1-3: Context-aware Semantic → Type → Fallback ===
          else {
            value = this.generateValue(col, domain);
          }

          // Apply unique constraint with retries
          if (col.isUnique && value !== null && uniqueSets[col.name]) {
            value = this.ensureUnique(
              () =>
                col.isPrimaryKey
                  ? this.generatePrimaryKey(col, pkCounter++)
                  : this.generateValue(col, domain),
              uniqueSets[col.name],
              value,
            );
          }

          row.push(value);
        }

        // Store PK values for FK resolution
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

  // ─── Table Domain Detection (Level 2) ──────────────────────────

  /**
   * Detect the semantic domain of a table based on its name.
   * This allows context-aware resolution of ambiguous columns like "name"/"nombre".
   */
  private detectTableDomain(tableName: string): TableDomain {
    const lower = tableName.toLowerCase();

    const domainPatterns: [string[], TableDomain][] = [
      // Person domain
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
      // Product domain
      [
        [
          'product', 'producto', 'articulo', 'article', 'item',
          'merchandise', 'good', 'service', 'servicio', 'menu_item',
          'dish', 'plato', 'book', 'libro', 'course', 'curso',
          'vehicle', 'vehiculo', 'property', 'propiedad',
        ],
        'product',
      ],
      // Category domain
      [
        [
          'categori', 'category', 'department', 'departamento',
          'section', 'seccion', 'genre', 'genero', 'type', 'tipo',
          'tag', 'etiqueta', 'topic', 'tema', 'brand', 'marca',
        ],
        'category',
      ],
      // Order domain
      [
        [
          'order', 'pedido', 'purchase', 'compra', 'sale', 'venta',
          'invoice', 'factura', 'transaction', 'transaccion',
          'payment', 'pago', 'cart', 'carrito', 'booking', 'reserva',
        ],
        'order',
      ],
      // Company domain
      [
        [
          'company', 'empresa', 'organization', 'organizacion',
          'business', 'negocio', 'store', 'tienda', 'shop',
          'branch', 'sucursal', 'supplier', 'proveedor', 'vendor',
        ],
        'company',
      ],
      // Location domain
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

  // ─── Primary Key Generation ────────────────────────────────────

  private generatePrimaryKey(col: ColumnInfo, counter: number): any {
    if (col.dataType === 'UUID') {
      return faker.string.uuid();
    }
    return counter;
  }

  // ─── Value Generation Cascade ──────────────────────────────────

  /**
   * Generate a value using the cascade:
   * 1. Context-aware match (table domain + column name)
   * 2. Generic name match (column name only)
   * 3. SQL type match
   * 4. Absolute fallback
   */
  private generateValue(col: ColumnInfo, domain: TableDomain): any {
    // Step 1: Context-aware match (Level 2)
    const contextual = this.matchByContext(col.name, domain);
    if (contextual !== undefined) {
      return this.applyMaxLength(contextual, col.maxLength);
    }

    // Step 2: Generic name match (Level 1)
    const semantic = this.matchByName(col.name);
    if (semantic !== undefined) {
      return this.applyMaxLength(semantic, col.maxLength);
    }

    // Step 3: SQL type match
    const byType = this.matchByType(col.dataType, col.maxLength);
    if (byType !== undefined) {
      return byType;
    }

    // Step 4: Absolute fallback
    return this.applyMaxLength(faker.lorem.word(), col.maxLength);
  }

  // ─── Level 2: Context-Aware Matching ───────────────────────────

  /**
   * Resolve ambiguous column names using the table's domain context.
   * Only handles columns that change meaning based on table context.
   */
  private matchByContext(
    columnName: string,
    domain: TableDomain,
  ): any | undefined {
    const lower = columnName.toLowerCase();

    // "name" / "nombre" — ambiguous, resolved by domain
    // EXCLUDE first_name, last_name etc. (they are handled specifically in Level 1)
    if (
      this.isMatch(lower, ['name', 'nombre']) &&
      !/(first_?name|last_?name|full_?name|nombre_completo|primer_nombre|apellido)/i.test(lower)
    ) {
      return this.generateNameByDomain(domain);
    }

    // "description" / "descripcion"
    if (this.isMatch(lower, ['description', 'descripcion'])) {
      return this.generateDescriptionByDomain(domain);
    }

    // "title" / "titulo"
    if (this.isMatch(lower, ['title', 'titulo'])) {
      return this.generateTitleByDomain(domain);
    }

    // "status" / "estado"
    if (this.isMatch(lower, ['status', 'estado'])) {
      return this.generateStatusByDomain(domain);
    }

    return undefined;
  }

  /**
   * Generate a "name" value appropriate to the table's domain.
   */
  private generateNameByDomain(domain: TableDomain): string {
    switch (domain) {
      case 'person':
        return faker.person.fullName();
      case 'product':
        return faker.commerce.productName();
      case 'category':
        return faker.commerce.department();
      case 'company':
        return faker.company.name();
      case 'location':
        return faker.location.city();
      case 'order':
        return `ORD-${faker.string.alphanumeric(8).toUpperCase()}`;
      default:
        return faker.commerce.productName();
    }
  }

  /**
   * Generate a "description" value appropriate to the table's domain.
   */
  private generateDescriptionByDomain(domain: TableDomain): string {
    switch (domain) {
      case 'product':
        return faker.commerce.productDescription();
      case 'category':
        return `${faker.commerce.department()} products and accessories`;
      case 'company':
        return faker.company.catchPhrase();
      case 'person':
        return faker.person.bio();
      default:
        return faker.lorem.sentence();
    }
  }

  /**
   * Generate a "title" value appropriate to the table's domain.
   */
  private generateTitleByDomain(domain: TableDomain): string {
    switch (domain) {
      case 'person':
        return faker.person.jobTitle();
      case 'product':
        return faker.commerce.productName();
      case 'company':
        return faker.person.jobTitle();
      default:
        // For projects, tasks, generic tables: use a meaningful phrase
        return faker.company.catchPhrase();
    }
  }

  /**
   * Generate a "status" value appropriate to the table's domain.
   */
  private generateStatusByDomain(domain: TableDomain): string {
    switch (domain) {
      case 'order':
        return faker.helpers.arrayElement([
          'pending',
          'processing',
          'shipped',
          'delivered',
          'cancelled',
        ]);
      case 'person':
        return faker.helpers.arrayElement(['active', 'inactive', 'suspended']);
      case 'product':
        return faker.helpers.arrayElement([
          'available',
          'out_of_stock',
          'discontinued',
        ]);
      default:
        return faker.helpers.arrayElement(['active', 'inactive', 'pending']);
    }
  }

  // ─── Level 1: Regex-Based Name Matching ──────────────────────────

  /**
   * Match column names to generators using regex patterns.
   * Ordered from most specific to least specific.
   * Ambiguous columns (name, nombre, description, status) are handled
   * by Level 2 context matching above.
   */
  private matchByName(name: string): any | undefined {
    const rules: [RegExp, () => any][] = [
      // ─── Person: specific sub-fields BEFORE generic "name" ───────
      [/full_?name|nombre_completo|complete_name/i,        () => faker.person.fullName()],
      [/first_?name|primer_nombre/i,                       () => faker.person.firstName()],
      [/last_?name|apellido|surname/i,                     () => faker.person.lastName()],
      [/\bage\b|\bedad\b/i,                                () => faker.number.int({ min: 18, max: 80 })],
      [/birth|nacimiento/i,                                () => faker.date.birthdate().toISOString().split('T')[0]],

      // ─── Contact ──────────────────────────────────────────────────
      [/email|correo/i,                                    () => faker.internet.email()],
      [/phone|telefono|celular|mobile/i,                   () => faker.phone.number()],
      [/username|user_name|login/i,                        () => faker.internet.username()],
      [/password|contrase.a|passwd/i,                      () => faker.internet.password()],
      [/avatar|profile_image|foto_perfil/i,                () => faker.image.url()],
      [/ip_address|ip_addr/i,                              () => faker.internet.ipv4()],

      // ─── Location: catches office_location, home_address, etc. ───
      [/location|address|direccion|street|calle/i,         () => faker.location.streetAddress()],
      [/city|ciudad/i,                                     () => faker.location.city()],
      [/country|pais/i,                                    () => faker.location.country()],
      [/zip|postal|codigo_postal/i,                        () => faker.location.zipCode()],
      [/state|provincia|region/i,                          () => faker.location.state()],

      // ─── Company / Work ───────────────────────────────────────────
      [/company|empresa/i,                                 () => faker.company.name()],
      [/department|departamento/i,                         () => faker.commerce.department()],
      [/role|rol|job_title|puesto|cargo|position|assigned_role/i, () => faker.person.jobTitle()],

      // ─── Commerce ─────────────────────────────────────────────────
      [/\bprice\b|precio|unit_price|precio_unitario/i,     () => faker.commerce.price({ min: 5, max: 999 })],
      [/total|subtotal|\bamount\b|monto|importe/i,         () => faker.commerce.price({ min: 10, max: 5000 })],
      [/budget|presupuesto/i,                              () => faker.finance.amount({ min: 1000, max: 100000, dec: 2 })],
      [/account|cuenta/i,                                  () => faker.finance.accountNumber()],
      [/salary|salario|sueldo/i,                           () => faker.finance.amount({ min: 2000, max: 15000, dec: 2 })],

      // ─── Quantities ───────────────────────────────────────────────
      [/quantity|cantidad|\bqty\b|stock|units|unidades/i,  () => faker.number.int({ min: 1, max: 20 })],
      [/rating|calificacion|score|puntaje/i,               () => faker.number.float({ min: 1, max: 5, fractionDigits: 1 })],
      [/percentage|porcentaje|percent/i,                   () => faker.number.float({ min: 0, max: 100, fractionDigits: 2 })],
      [/weight|peso/i,                                     () => faker.number.float({ min: 0.1, max: 100, fractionDigits: 2 })],

      // ─── Dates: end/due in the future, start/hire in the past ────
      [/end_date|due_date|fecha_fin|fecha_vencimiento|expires/i, () => faker.date.future().toISOString().split('T')[0]],
      [/start_date|hire_date|fecha_inicio|fecha_registro|fecha_pedido|created_at|updated_at|deleted_at/i,
                                                           () => faker.date.past().toISOString().split('T')[0]],
      [/\bdate\b|\bfecha\b/i,                              () => faker.date.past().toISOString().split('T')[0]],

      // ─── Web / Media ──────────────────────────────────────────────
      [/url|website|link|webpage/i,                        () => faker.internet.url()],
      [/image|imagen|photo|foto/i,                         () => faker.image.url()],
      [/color|colour/i,                                    () => faker.color.human()],

      // ─── Text content ──────────────────────────────────────────────
      [/comment|comentario|note|nota|review|rese.a|feedback/i, () => faker.lorem.sentences(2)],
      [/\bbio\b|about|acerca/i,                            () => faker.person.bio()],

      // ─── Identity ─────────────────────────────────────────────────
      [/\buuid\b|\bguid\b/i,                               () => faker.string.uuid()],
      [/\bcode\b|\bcodigo\b|\bsku\b|reference|referencia/i, () => faker.string.alphanumeric(8).toUpperCase()],

      // ─── Boolean-like prefixes (is_active, has_access, etc.) ─────
      [/^is_|^has_|^can_/i,                                () => faker.datatype.boolean()],
    ];

    for (const [pattern, generator] of rules) {
      if (pattern.test(name)) {
        return generator();
      }
    }

    return undefined;
  }


  // ─── SQL Type Matching ─────────────────────────────────────────

  private matchByType(
    dataType: string,
    maxLength?: number,
  ): any | undefined {
    switch (dataType) {
      case 'VARCHAR':
      case 'CHAR':
        return this.applyMaxLength(faker.lorem.words(3), maxLength);
      case 'TEXT':
        return faker.lorem.words(3);
      case 'INTEGER':
      case 'BIGINT':
      case 'SMALLINT':
        return faker.number.int({ min: 1, max: 9999 });
      case 'SERIAL':
      case 'BIGSERIAL':
        return faker.number.int({ min: 1, max: 9999 });
      case 'DECIMAL':
      case 'NUMERIC':
      case 'FLOAT':
      case 'REAL':
      case 'DOUBLE PRECISION':
        return faker.number.float({ min: 0, max: 9999, fractionDigits: 2 });
      case 'BOOLEAN':
        return faker.datatype.boolean();
      case 'DATE':
        return faker.date.past().toISOString().split('T')[0];
      case 'TIMESTAMP':
      case 'TIMESTAMPTZ':
        return faker.date.past().toISOString();
      case 'UUID':
        return faker.string.uuid();
      case 'JSON':
      case 'JSONB':
        return '{}';
      default:
        return undefined;
    }
  }

  // ─── Utility Methods ───────────────────────────────────────────

  /**
   * Check if a column name matches any of the given keywords.
   * Supports exact match, prefix_*, and *_suffix patterns.
   */
  private isMatch(columnName: string, keywords: string[]): boolean {
    return keywords.some(
      (kw) =>
        columnName === kw ||
        columnName.endsWith(`_${kw}`) ||
        columnName.startsWith(`${kw}_`),
    );
  }

  private applyMaxLength(value: any, maxLength?: number): any {
    if (maxLength && typeof value === 'string' && value.length > maxLength) {
      return value.substring(0, maxLength);
    }
    return value;
  }

  private ensureUnique(
    generator: () => any,
    existingValues: Set<any>,
    initialValue: any,
  ): any {
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

    const fallback =
      typeof initialValue === 'string'
        ? `${initialValue}_${existingValues.size}`
        : initialValue + existingValues.size;

    existingValues.add(fallback);
    return fallback;
  }
}
